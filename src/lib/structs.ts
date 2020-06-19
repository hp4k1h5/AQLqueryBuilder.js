export interface query {
  /**
  * the name of the ArangoSearch view the query will be run against
  * */
  view: string,
  /**
  * the names of the collections indexed by @view to query
  * */
  collections: collection[],
  /**
  * either an array of @term interfaces or a string to be parsed by @parseQuery
  * */
  terms: term[] | string,
  /**
  * the name of the document key to search, must be the same across all
  * documents 
  * */
  key?: string,
  /**
  * a list of @filter interfaces
  * */
  filters?: filter[],
}

export interface collection {
  /**
  * the name of the collection
  * */
  name: string,
  /**
  * the name of the text analyzer
  * */
  analyzer: string,
}

export interface term {
  type: string,
  val: string,
  op: string,
}

export interface filter {
  field: string,
  op: string,
  val: string | number | Date,
}
