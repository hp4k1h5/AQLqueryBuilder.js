# AQLqueryBuilder.js
> a typescript query builder for [arangodb](https://www.arangodb.com)'s [ArangoSearch](https://www.arangodb.com/docs/stable/arangosearch.html)

## overview
ArangoSearch provides a high-level API for interacting with Arango Search Views
through the Arango Query Language (AQL). This library aims to provide a query
parser and AQL query builder to enable full boolean search operations across
all available Arango Search View capabilities, including, `PHRASE` and
`TOKENS` operations. With minimal syntax overhead the user can generate
multi-lingual and language-specific, complex phrase, proximity and tokenized
search terms.

For example, passing a search phrase like: `+mandatory -exclude ?"optional
phrase"` to `buildAQL`, will produce the following query:
```aql
FOR doc IN search_view

  SEARCH
    MIN_MATCH(
      ANALYZER(
        TOKENS(@value0, @value1)
        ALL IN doc.@value2, @value1),
    @value3) OR (MIN_MATCH(
      ANALYZER(
        TOKENS(@value0, @value1)
        ALL IN doc.@value2, @value1),
    @value3) AND @value4)

     AND

     MIN_MATCH(
      ANALYZER(
        TOKENS(@value5, @value1)
        NONE IN doc.@value2, @value1),
    @value3)

    OPTIONS @value6
      SORT TFIDF(doc) DESC

      LIMIT @value7, @value8
  RETURN doc
```
This query will retrieve all documents that __include__ the term "mandatory"
AND __do not include__ the term "exclude", AND whose ranking will be boosted by the
presence of the phrase "optional phrase". If no mandatory or exclude terms are
provided, optional terms are considered required, so as not to retrieve all
documents.

## setup
## installation
## usage
### query object

`buildAQL` accepts an object with the following properties:
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
  "query": "either a +query ?\"string for parseQuery to parse\"",
  "query": [
           {"type": "phr", "op": "?", "val": "\"or a list of query objects\""},
           {"type": "tok", "op": "-", "val": "tokens"}
         ],
  "limit":
    {
      "start": 0,
      "end": 20,
    }
}
```
### default query syntax
## bugs
## contributing
