# AQLqueryBuilder.js
> a typescript query builder for [arangodb](https://www.arangodb.com)'s [ArangoSearch](https://www.arangodb.com/docs/stable/arangosearch.html)

[![search bar demonstration with schematic query interface](./img/searchbar_demo.png)](https://hp4k1h5.github.io/#search-box) 

> See working demo at [hp4k1h5.github.io](https://hp4k1h5.github.io/#search-box).

<!-- vim-markdown-toc GFM -->

* [Patch Notes](#patch-notes)
* [Compatabilities](#compatabilities)
* [overview](#overview)
* [setup](#setup)
* [installation](#installation)
* [usage](#usage)
* [Exported Functions](#exported-functions)
  * [`buildAQL()`](#buildaql)
    * [query](#query)
    * [limit](#limit)
    * [`query` example](#query-example)
  * [boolean search logic](#boolean-search-logic)
    * [`+` AND](#-and)
    * [`?` OR](#-or)
    * [`-` NOT](#--not)
  * [default query syntax](#default-query-syntax)
    * [Example](#example)
* [bugs](#bugs)
* [contributing](#contributing)

<!-- vim-markdown-toc -->

## Patch Notes

- aqlQueryBuilder.js v0.1.3
  - updated compatabilities
    - arangodb: ~~v3.6.5~~ → 3.8.4  
  - updated dependencies
    - arangojs: ~~v6.14.1~~ → 7.6.1

## Compatabilities

This package is tested against the following versions: 
- arangojs: 7.6.1
- arangodb: 3.8.4  

## overview

ArangoSearch provides a low-level API for interacting with Arango Search Views through the Arango Query Language (AQL). This library aims to provide a query parser and AQL query builder to enable full boolean search operations across all available Arango Search View capabilities, including, `PHRASE` and `TOKENS` operations. With minimal syntax overhead the user can generate multi-lingual and language-specific, complex phrase, (proximity... TBD) and tokenized search terms.

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

See [default query syntax](#default-query-syntax) and this schematic [example](#example) for more details.

If multiple collections are passed, the query is replicated across all passed collections, see examples in 'tests/cols.ts'. In the future this will also accommodate multiple key searches.

___
## setup

1) running generated AQL queries will require a running ArangoDB v3.8+ instance. This package is tested against arangodb v3.8.4 🥑

## installation

1) run `yarn add @hp4k1h5/aqlquerybuilder.js`  
    or `npm install --save @hp4k1h5/aqlquerybuilder.js`  
    in a directory containing a `package.json` file.  
   __or__  
  clone this repository in your node compatible project. And run `yarn` from
  inside the directory.

2) import/require the exported functions

```js
// use either
import {buildAQL, parseQuery} from '@hp4k1h5/aqlquerybuilder.js'
// or
const {buildAQL} = require('@hp4k1h5/aqlquerybuilder.js')
```

This has been tested for
- ✅ node v17.3.0
- ✅ typescript v4.5.4

## usage

__for up-to-date documentation, run `yarn doc && serve docs/` from the project directory root.__

AQLqueryBuilder aims to provide cross-collection and cross-language, multi-key boolean search capabilities to the library's user.

Please ensure that the data you are trying to query against is indexed by an ArangoSearch View. The query will target all combinations of provided collections, analyzers and keys an simultaneously. This allows for granular multi-language search. This library is primarily built for academic and textual searches, and is ideally suited for documents like books, articles, and other text-heavy media.

AQLqueryBuilder works best as a document query tool. Leveraging ArangoSearch's built-in language stemming analyzers allows for complex search phrases to be run against any number of language-specific collections simultaneously.

__Example:__
```javascript
import {buildAQL} from '@hp4k1h5/aqlquerybuilder.js'

const queryObject = {
  "view": "the_arango-search_view-name",
  "collections": [{
    "name": "collection_name",
    "analyzer": "analyzer_name",
    "keys": ["text"]
  }],
  "terms": "+'query string' -for +parseQuery ?to parse"
}

const limit = {start:0, count: 20}

const aqlQuery = buildAQL(queryObject, limit)

// ... const cursor = await db.query(aqlQuery)
// ... const cursor = await db.query(buildAQL(queryObject, {start:20, count:20})
```

Generate documentation with `yarn doc && serve docs/` or see more examples in [tests/search.ts](tests/search.ts)

___

## Exported Functions

### `buildAQL()`

`buildAQL` accepts two parameters: `query` and `limit`

#### query

`query` is an object with the following keys:

• **view**: *string* (required): the name of the ArangoSearch view the query
will be run against

• **collections** (required): an array of objects of the indexed collections
to query. Objects have the following shape:
```json
{
  "name": "collection-name",
  "analyzer": "analyzer_name",
  "keys": ["text", "summary", "notes"]
}
```

`keys` are optional, though if key names are provided to `query.key`, and not all those keys are indexed by the collection, it is advisable to explicitly list only those keys on documents in that collection that are indexed by the analyzer. If a collection is indexed by multiple analyzers please list each collection-analyzer combination along with their relevant keys, unless a unified set of keys is provided to `query.key`.

• **terms** (required): either an array of `term` interfaces or a query string
to be parsed by `parseQuery()`.
- **term** (optional): a JSON object representing the search.
  - **val** *string* (required): a search term or phrase. For PHRASE
  searches, include one "quoted phrase" per val. For TOKENS you may combine
  multiple terms under a single analyzer or use one `term` per token.
  - **op** *string* (required): boolean operator; **one of `+ ? -`,**
  representing `AND OR NOT` respectively
  - **type** *string* (required): **one of `"phr"`** for PHRASES **or `"tok"`**
  for TOKENS.  

• **key** (optional | default: "text"): the name of the Arango document key to search within.

• **filters** (optional): a list of filter interfaces. See [arango FILTER operations](https://www.arangodb.com/docs/stable/aql/operations-filter.html) for more details. All [Arango operators](https://www.arangodb.com/docs/3.6/aql/operators.html ) Filters have the following shape:

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

to bring back up to the first 10 results
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
      "analyzer": "analyzer_name",
      "keys": ["text", "summary", "notes"]
    },
    {
      "name":"collection_es",
      "analyzer": "analyzer_es",
      "keys": ["texto", "resumen", "notas"]
    }
  ],
  "terms": "either a +query ?\"string for parseQuery to parse\"    texto en español",
  "terms": [
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

### boolean search logic

> Boolean operators form the basis of mathematical sets and database logic. They connect your search words together to either narrow or broaden your set of results.  The three basic boolean operators are: AND, OR, and NOT. 

from [mit's Database Search Tips](https://libguides.mit.edu/c.php?g=175963&p=1158594)

#### `+` AND

* Mandatory terms and phrases. All results MUST INCLUDE these terms and phrases.

#### `?` OR

* Optional terms and phrases. If there are ANDS or NOTS, these serve as match score "boosters". If there are no ANDS or NOTS, ORS become required in results.

#### `-` NOT

* Search results MUST NOT INCLUDE these terms and phrases. If a result that would otherwise have matched, contains one or more terms or phrases, it will not be included in the result set. If there are no required or optional terms, all results that do NOT match these terms will be returned.

### default query syntax

for more information on boolean search logic see [above](#boolean-search-logic)

The default syntax accepted by `buildAQL()`'s query paramter key `terms` when passing in a string, instead of a `term` interface compatible array is as follows:

1) Everything inside single or double quotes is considered a `PHRASE`
2) Everything else is considered a word to be analyzed by `TOKENS`
3) Every individual search word and quoted phrase may be optionally prefixed
by one of the following symbols `+ ? -`, or the plus-sign, the question-mark,
and the minus-sign. If a word has no operator prefix, it is considered
optional and is counted as an `OR`.

Please see [tests/parse.ts](tests/parse.ts) for more examples.

#### Example

input `one +two -"buckle my shoe"` and `parseQuery()` will interpret that query string as follows:

|        | ANDS | ORS | NOTS             |
| -      | -    | -   | -                |
| PHRASE |      |     | "buckle my shoe" |
| TOKENS | two  | one |                  |

The generated AQL query, when run, will bring back only results that contain "two", that do not contain the phrase "buckle my shoe", and that optionally contain "one". In this case, documents that contain "one" will be likely to score higher than those that do not.

When the above phrase `one +two -"buckle my shoe"` is run against the following documents:

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
