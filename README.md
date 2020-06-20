# AQLqueryBuilder.js
> a typescript query builder for [arangodb](https://www.arangodb.com)'s [ArangoSearch](https://www.arangodb.com/docs/stable/arangosearch.html)

##### !! warning !! experimental and unstable

## overview
ArangoSearch provides a low-level API for interacting with Arango Search Views
through the Arango Query Language (AQL). This library aims to provide a query
parser and AQL query builder to enable full boolean search operations across
all available Arango Search View capabilities, including, `PHRASE` and
`TOKENS` operations. With minimal syntax overhead the user can generate
multi-lingual and language-specific, complex phrase, (proximity... TBD) and tokenized
search terms.

For example, passing a search phrase like: `+mandatory -exclude ?"optional
phrase"` to `buildAQL`'s query object as the `term` key, will produce the
following query:

```aql
  SEARCH
    MIN_MATCH(
      ANALYZER(
        TOKENS(@value0, @value1)
        ALL IN doc.@value2, @value1),
    @value3) OR (MIN_MATCH(
      ANALYZER(
        TOKENS(@value0, @value1)
        ALL IN doc.@value2, @value1),
    @value3) AND (PHRASE(doc.@value2, @value4, @value1)))

     AND  

     MIN_MATCH(
      ANALYZER(
        TOKENS(@value5, @value1)
        NONE IN doc.@value2, @value1),
    @value3)

    OPTIONS @value6
      SORT TFIDF(doc) DESC
```
This query will retrieve all documents that __include__ the term "mandatory"
AND __do not include__ the term "exclude", AND whose ranking will be boosted by the
presence of the phrase "optional phrase". If no mandatory or exclude terms are
provided, optional terms are considered required, so as not to retrieve all
documents.

## setup

1) running generated AQL queries will require a working arangodb instance. In
the future, it is hoped that this package can be imported and used in the
`arangosh`, as well as client and server side. Currently there is only limited
support for server-side use.

## installation

!! packaging and export behavior is not stable, and is likely to change
!! significantly in the short-term
1) clone this repository in your es6 compatible project.
2) run `yarn install` from the project directory.
3) unless you are importing into a typescript project, i believe you will have
to run `yarn tsc` from the project directory, and possibly change the compile
target in `tsconfig.json`

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
This allows for true multi-language search provided all documents index the
same key as all other documents in the view. While there are plans to expand
on this functionality to provide multi-key search, this library is primarily
built for academic and textual searches, and is ideally suited for documents
like books, articles, and other media where most of the data resides in a
single place, i.e. document `key`, or `field`.

This works best as a document query tool. Leveraging ArangoSearch's built-in
language stemming analyzers allows for complex search phrases to be run
against any number of language-specific collections simultaneously.

For an example of a multi-lingual document ingest/parser/indexer, please see
[ptolemy's curator](https://gitlab.com/HP4k1h5/nineveh/-/tree/master/ptolemy/dimitri/curator.js)

__Example:__
```javascript
import {buildAQL} from 'path/to/AQLqueryBuilder'
const queryObject = {
  "view": "the_arango-search_view-name",
  "collections": [{
    "name": "collection_name",
    "analyzer": "analyzer_name"
  }],
  "query": "+'query string' -for +parseQuery ?to parse"
}
const aqlQuery = buildAQL(queryObject)
// ... const cursor = await db.query(aqlQuery)
// ... const cursor = await db.query(aqlQuery, {start:20, end:40})
```
`collections` is an array of `collection` objects. This allows searching and
filtering across collections impacted by the search.

### query object

`buildAQL` accepts an object with the following properties:

• **view**: *string* (required): the name of the ArangoSearch view the query
will be run against

• **collections** (required): the names of the collections indexed by @view to query

• **terms** (required): either an array of @term interfaces or a string to be
parsed by @parseQuery

• **key** (optional | default: "text"): the name of the Arango document key to search
within.

• **filters** (optional): a list of @filter interfaces

___

Example:
```json
{
  "view": "the_arango-search_view-name",
  "collections": [
    {
      "name":
      "collection_name", "analyzer":
       "analyzer_name"
    }
  ],
  "key": "text",
  "query": "either a +query ?\"string for parseQuery to parse\"",
  "query": [
           {"type": "phr", "op": "?", "val": "\"or a list of query objects\""},
           {"type": "tok", "op": "-", "val": "tokens"}
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
  not be included in the result set.

### default query syntax
for more information on boolean search logic see
  [above](#boolean-search-logic)

The default syntax accepted by `AQLqueryBuilder`'s `query` object's `terms`
key is as follows:

1) Everything inside single or double quotes is considered a `PHRASE`
2) Everything else is considered a word to be analyzed by `TOKENS`
3) Every individual search word and quoted phrase may be optionally prefixed
by one of the following symbols `+ ? -`, or the plus-sign, the question-mark,
and the minus-sign. If a word has no operator prefix, it is considered
optional and is counted as an `OR`.

Example:
input `one +two -"buckle my shoe"` and the queryParser will interpret as
follows:

|        | ANDS | ORS | NOTS             |
| -      | -    | -   | -                |
| PHRASE |      |     | "buckle my shoe" |
| TOKENS | two  | one |                  |

The generated AQL query, when run, will bring back only results that contain
"two", that do not contain the phrase "buckle my shoe", and that optionally
contain "one". In this case, documents that contain "one" will be likely to
score higher than those that do not.

## bugs
plase see [bugs](https://github.com/HP4k1h5/AQLqueryBuilder.js/issues/new?assignees=HP4k1h5&labels=bug&template=bug_report.md&title=basic)
## contributing
plase see [./.github/CONTRIBUTING.md]
