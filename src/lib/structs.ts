export interface query {
  /**
  * the name of the ArangoSearch view the query will be run against
  * */
  view: string,
  /**
  * the names of the collections indexed by @view to query
  * */
  collections: string[],
  /**
  * either a @terms interface or a string to be parsed by @parseQuery
  * */
  terms: term[] | string,
  /**
  * a list of @filter interfaces
  * */
  filters?: any,
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
export interface term {
  /**
   * Mandatory terms and phrases. All results MUST INCLUDE these terms and
   * phrases.
  **/
  ANDS?: searches,
  /**
   * Optional terms and phrases. If there are ANDS or NOTS, these serve as
   * match score "boosters". If there are no ANDS or NOTS, ORS become required
   * in results.
  **/
  ORS?: searches,
  /**
   * Search results MUST NOT INCLUDE these terms and phrases. If a result that
   * would otherwise have matched, contains one or more terms or phrases, it
   * will not be included in the result set.
  **/
  NOTS?: searches,
}

export interface searches {
  analyzers: any,
  phrases: any,
  /* proximity: any, */
}
