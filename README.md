# AQLqueryBuilder.js
> a typescript query builder for [arangodb](https://www.arangodb.com)'s [ArangoSearch](https://www.arangodb.com/docs/stable/arangosearch.html)

See working demo at [hp4k1h5.github.io](https://hp4k1h5.github.io/#search-box).

**!Note** AQLqueryBuilder.js does NOT contain any code for the search bar, only the
query string parser and AQL builder. Unabstracted code for the searchbar is
located [here](https://github.com/HP4k1h5/hp4k1h5.github.io/tree/main/demos/src/components/search).

![search bar demonstration with schematic query
interface](./img/searchbar_demo.png)

* [Patch Notes](#patch-notes)
* [overview](#overview)
* [setup](#setup)
* [installation](#installation)
* [usage](#usage)
  * [`buildAQL()`](#buildaql())
  * [boolean search logic](#boolean-search-logic)
  * [default query syntax](#default-query-syntax)
    * [Example](#example)
* [bugs](#bugs)
* [contributing](#contributing)

## Patch Notes
- v0.1.1
  - ❌ Breaking change! `buildAQL()`'s `limit` parameter no longer accepts key
    `end`, which has been renamed, per Arango spec, to `count`. The functionality
    remains the same, which is why the patch bump. Please accept my apologies
    for the un-semver approach. I have a personal philosophy that v0.X.X is
    not really subject to the standard rules of semver, but I will do my best
    to not present further breaking changes without upping at least the minor
    version.
  - multi-key search 🔑🗝
      `query.key` now accepts in addition to a string value, an array of
      strings over which the query is to be run. this can be useful if you
      have multiple fields with textual information. Theoretically, each
      chapter of a book could be stored on its own key. Or a document could
      have be translated into several languages, each stored on its own key.
      ArangoSearch will handle the indexed fields by itself, provided the
      collection and analyzer pair that indexes the key are provided to
      `query.collections`

## overview

ArangoSearch provides a low-level API for interacting with Arango Search Views
through the Arango Query Language (AQL). This library aims to provide a query
parser and AQL query builder to enable full boolean search operations across
all available Arango Search View capabilities, including, `PHRASE` and
`TOKENS` operations. With minimal syntax overhead the user can generate
multi-lingual and language-specific, complex phrase, (proximity... TBD) and
tokenized search terms.

For example, passing a search phrase like:
```txt
some +words -not +"phrase search" -"not these" ?"could have"`
```
to `buildAQL()`'s `query` parameter, will
produce a query like the following (see [this example](#query-example) and
those found in `tests/`:

```c
  FOR doc IN view

SEARCH
  (PHRASE(doc.text, "phrase search", analyzer)) AND MIN_MATCH(
    ANALYZER(
      TOKENS("words", analyzer)
      ALL IN doc.text, analyzer),
  1) OR ((PHRASE(doc.text, "phrase search", analyzer)) AND MIN_MATCH(
    ANALYZER(
      TOKENS("words", analyzer)
      ALL IN doc.text, analyzer),
  1) AND (PHRASE(doc.text, "could have", analyzer)) OR MIN_MATCH(
    ANALYZER(
      TOKENS(other, analyzer)
      ANY IN doc.text, analyzer),
  1))
  
   AND  
   NOT  (PHRASE(doc.text, "not these", analyzer))
   AND  MIN_MATCH(
    ANALYZER(
      TOKENS("nor", analyzer)
      NONE IN doc.text, analyzer),
  1)
  
  OPTIONS {"collections": ["col"]}
    SORT TFIDF(doc) DESC

    LIMIT 0, 1
  RETURN doc`
```

This query will retrieve all documents that __include__ the term "mandatory"
AND __do not include__ the term "exclude", AND whose ranking will be boosted
by the presence of the phrase "optional phrase". If no mandatory or exclude
terms are provided, optional terms are considered required, so as not to
retrieve all documents.

See [default query syntax](#default-query-syntax) and this schematic
[example](#example) for more details.

If multiple collections are passed, the above query is replicated across all
passed collections, see examples in 'tests/cols.ts'. In the future this will
also accommodate multiple key searches.

___
## setup

1) running generated AQL queries will require a running ArangoDB v3.6+
instance. This package is tested against v3.6.5 🥑

## installation
currently there is only support for server-side use.

1) run `yarn add @hp4k1h5/AQLqueryBuilder.js`  
    or `npm install --save @hp4k1h5/AQLqueryBuilder.js`  
    in a directory containing a `package.json` file.  
   __or__  
  clone this repository in your node compatible project. And run `yarn` from
  inside the directory.

2) import/require the exported functions
```js
// use either
import {buildAQL, parseQuery} from '@hp4k1h5/AQLqueryBuilder.js'
// or
const {buildAQL} = require('@hp4k1h5/AQLqueryBuilder.js')
```
  This has been tested for
  - ✅ node v14.4.0
  - ✅ typescript v3.9.5

## usage
__for up-to-date documentation, run `yarn doc && serve docs/` from the project
  directory root.__

AQLqueryBuilder aims to provide cross-collection and cross-language boolean
search capabilities to the library's user. Currently, this library makes a
number of assumptions about the way your data is stored and indexed, but these
are hopefully compatible with a wide range of setups.

The primary assumption this library makes is that the data you are trying to
query against is indexed by an ArangoSearch View, and that all documents index
the same exact field. This field, passed to the builder as a key on the
`query` object passed to e.g. `buildAQL()`, can be indexed by any number of
analyzers, and the query will target all supplied collections simultaneously.
This allows for true multi-language search, provided all analyzers and
indexers index the same key as all other documents in the view. While there
are plans to expand on this functionality to provide multi-key search, this
library is primarily built for academic and textual searches, and is ideally
suited for documents like books, articles, and other media where most of the
data resides in a single place, i.e. document `key`, or `field`.

AQLqueryBuilder works best as a document query tool. Leveraging ArangoSearch's
built-in language stemming analyzers allows for complex search phrases to be
run against any number of language-specific collections simultaneously.


__Example:__
```javascript
import {buildAQL} from '@hp4k1h5/AQLqueryBuilder.js'

const queryObject = {
  "view": "the_arango-search_view-name",
  "collections": [{
    "name": "collection_name",
    "analyzer": "analyzer_name"
  }],
  "query": "+'query string' -for +parseQuery ?to parse"
}

const limit = {start:0, count: 20}

const aqlQuery = buildAQL(queryObject, limit)

// ... const cursor = await db.query(aqlQuery)
// ... const cursor = await db.query(buildAQL(queryObject, {start:20, count:20})
```

Generate documenation with `yarn doc && serve docs/` or see more examples in
e.g. [tests/search.ts](tests/search.ts)

___

### `buildAQL()`

`buildAQL` accepts two parameters: `query` and `limit`

#### query
• **view**: *string* (required): the name of the ArangoSearch view the query
will be run against

• **collections** (required): an array of objects of the indexed collections
to query. Objects have the following shape:
```json
{
  "name": "collection-name",
  "analyzer": "analyzer_name"
}
```

• **query** (required): either an array of `term` interfaces or a query string
to be parsed by `parseQuery`.
- **term** (optional): a JSON object representing the search.
  - **val** *string* (required): a search term or phrase. For PHRASE
  searches, include one "quoted phrase" per val. For TOKENS you may combine
  multiple terms under a single analyzer or use one `term` per token.
  - **op** *string* (required): boolean operator; **one of `+ ? -`,**
  representing `AND OR NOT` respectively
  - **type** *string* (required): **one of `"phr"`** for PHRASES **or `"tok"`**
  for TOKENS.  

• **key** (optional | default: "text"): the name of the Arango document key to
search within.

• **filters** (optional): a list of filter interfaces. See [arango FILTER
operations](https://www.arangodb.com/docs/stable/aql/operations-filter.html)
for more details. All [Arango
operators](https://www.arangodb.com/docs/3.6/aql/operators.html ) Filters have
the following shape:
```json
{
  "field": "the name of the field, i.e. Arango document key to filter on",
  "op": "one of: == != < > <= >= IN NOT IN LIKE NOT LIKE =~ !~     ",
  "val": "the "
}
```

#### limit
an object with the following keys:
- `start` (integer) 0-based result pagination lower bound.
- `count` (integer) total number of results to return.
i.e. to bring back up to the first 10 results
```json
{"start":0, "count":10}
```
and the next page would be
```json
{"start":10, "count":10}
```

#### `query` example
```json
{
  "view": "the_arango-search_view-name",
  "collections": [
    {
      "name":"collection_name",
      "analyzer": "analyzer_name"
    }
  ],
  "key": "text",
  "query": "either a +query ?\"string for parseQuery to parse\"",
  "query": [
           {"type": "phr", "op": "?", "val": "\"!!! OR a list of query objects\""},
           {"type": "phr", "op": "?", "val": "optional phrases"},
           {"type": "tok", "op": "-", "val": "excluded tokens"},
           {"type": "tok", "op": "+", "val": "mandatory tokens"}
         ],
  "filters": [
    {
      "field": "field_name",
      "op": ">",
      "val": 0
    }
  ]
}
```

___


**end** (optional: default: 20): the 1-based inclusive ending index of the
result set to result


___
### boolean search logic

Quoting [mit's Database Search Tips](https://libguides.mit.edu/c.php?g=175963&p=1158594):

> Boolean operators form the basis of mathematical sets and database logic.
    They connect your search words together to either narrow or broaden your
    set of results.  The three basic boolean operators are: AND, OR, and NOT.

#### `+` AND

* Mandatory terms and phrases. All results MUST INCLUDE these terms and
  phrases.

#### `?` OR

* Optional terms and phrases. If there are ANDS or NOTS, these serve as match
  score "boosters". If there are no ANDS or NOTS, ORS become required in
  results.

#### `-` NOT

* Search results MUST NOT INCLUDE these terms and phrases. If a result that
  would otherwise have matched, contains one or more terms or phrases, it will
  not be included in the result set. If there are no required or optional
  terms, all results that do NOT match these terms will be returned.

### default query syntax

for more information on boolean search logic see
  [above](#boolean-search-logic)

The default syntax accepted by `buildAQL()`'s query paramter key `terms` when
passing in a string, instead of a `term` interface compatible array is as
follows:

1) Everything inside single or double quotes is considered a `PHRASE`
2) Everything else is considered a word to be analyzed by `TOKENS`
3) Every individual search word and quoted phrase may be optionally prefixed
by one of the following symbols `+ ? -`, or the plus-sign, the question-mark,
and the minus-sign. If a word has no operator prefix, it is considered
optional and is counted as an `OR`.

Please see [tests/parse.ts](tests/parse.ts) for more examples.


#### Example

input `one +two -"buckle my shoe"` and `parseQuery()` will interpret that
query string as follows:

|        | ANDS | ORS | NOTS             |
| -      | -    | -   | -                |
| PHRASE |      |     | "buckle my shoe" |
| TOKENS | two  | one |                  |

The generated AQL query, when run, will bring back only results that contain
"two", that do not contain the phrase "buckle my shoe", and that optionally
contain "one". In this case, documents that contain "one" will be likely to
score higher than those that do not.

When the above phrase `one +two -"buckle my shoe"` is run against the
following documents:

```boxcar
┏━━━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━┓
┃ Document A       ┃  ┃  Document B      ┃  ┃ Document C       ┃
┃ ----------       ┃  ┃  ----------      ┃  ┃ ----------       ┃
┃                  ┃  ┃ three four       ┃  ┃ one              ┃
┃  one    two      ┃  ┃                  ┃  ┃                  ┃
┃                  ┃  ┃ and two          ┃  ┃                  ┃
┃    buckle my shoe┃  ┃                  ┃  ┃                  ┃
┗━━━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━┛
```

only Document B is returned;  
Document A is excluded by the phrase "buckle my shoe"  
Document C does not contain the mandatory word "two"

___

## bugs
please see [bugs](https://github.com/HP4k1h5/AQLqueryBuilder.js/issues/new?assignees=HP4k1h5&labels=bug&template=bug_report.md&title=basic)

## contributing
please see [CONTRIBUTING](./.github/CONTRIBUTING.md)
