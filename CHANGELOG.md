# CHANGELOG

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


