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

/**
 * @terms are the basic boolean search logic terms applied to ArangoSearch
 * Views via the Arango Query Language (AQL). 
 * Example: {
 *  ANDS: {anas:[], phrs: []},
 * }
**/
export interface terms {
  /**
   * Mandatory terms and phrases. All results MUST INCLUDE these terms and
   * phrases.
  **/
  ANDS?: term[],
  /**
   * Optional terms and phrases. If there are ANDS or NOTS, these serve as
   * match score "boosters". If there are no ANDS or NOTS, ORS become required
   * in results.
  **/
  ORS?: term[],
  /**
   * Search results MUST NOT INCLUDE these terms and phrases. If a result that
   * would otherwise have matched, contains one or more terms or phrases, it
   * will not be included in the result set.
  **/
  NOTS?: term[],
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
