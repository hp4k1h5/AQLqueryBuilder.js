/**
 * passed to buildAQL, i.e. `let generatedAQL = buildAQL(query)`. Properties
 * mimic or match those familiar to AQL.
 * */
export interface query {
  /**
   * the name of the ArangoSearch View the query will be run against
   * */
  view: string
  /**
   * the names of the collections indexed by @param view to query
   * */
  collections: collection[]
  /**
   * either an array of @param term interfaces or a string to be parsed by `parseQuery()`
   * */
  terms: term[] | string
  /**
   * the name of the document key to search, currently must be the same across
   * all documents. @default "text"
   * */
  key?: string
  /**
   * a list of @filter interfaces. All filters are implicitly AND'ed together.
   * */
  filters?: filter[]
}

/**
 * Each collection referenced by the ArangoSearch that the user wishes to
 * include in the query must be listed as a collection of the following shape.
 *
 * A collection can be referenced by several analyzers and each must have its
 * own entry in `query.collections` in order to be included in the search.
 *
 * Alternatively, a document can be stored in several collections.
 *
 * In either case all desired collection/analyzer combinations must be
 * specified.
 * */
export interface collection {
  /**
   * the name of the collection
   * */
  name: string
  /**
   * the name of the text analyzer
   * */
  analyzer: string
}

/**
 * A piece of search query text. Can be a phrase or an individual word, and will
 * belong to one cell or other of the following grid:
 * ```
 *                       **ops**
 *             |        | ANDS | ORS | NOTS  |
 *             | -----  | ---- | --- | ----- |
 *  **types**  | PHRASE |  ✅  | ✅  |  ✅   |
 *             | TOKENS |  ✅  | ✅  |  ✅   |
 *             | PROXIM | TODO | TODO| TODO  |
 * ```
 * */
export interface term {
  /**
   * must be one of [ 'phr', 'tok' ], corresponding to `PHRASE` and
   * `TOKENS` respectively.
   **/
  type: string
  /**
   * the search string
   * */
  val: string
  /**
   * must be one of [ '+', '?', '-' ] corresponding to `ANDS`, `ORS`, and
   * `NOTS`, respectively.
   * */
  op: string
}

/**
 * passed to AQL `FILTER`
 * */
export interface filter {
  /** the arango document field name to filter on */
  field: string
  /** the high-level operator to filter by */
  op: string
  /** the query string to filter with */
  val: string | number | Date
}
