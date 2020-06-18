import {buildCollections} from './collections'

export interface query {
  /** 
   * the name of the ArangoSearch view to query
  **/
  view: string,
  /**
   * the names, an array of strings, of the collections indexed by @view to
   * query
  **/
  collections: any,
  /**
   * either a @terms interface or a string to be parsed by @parseQuery
  **/
  terms: terms | string,
  /**
   * a list of @filter interfaces
  **/
  filters?: any,
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
  ANDS?: any,
  /**
   * Optional terms and phrases. If there are ANDS or NOTS, these serve as
   * match score "boosters". If there are no ANDS or NOTS, ORS become required
   * in results.
  **/
  ORS?: any,
  /**
   * Search results MUST NOT INCLUDE these terms and phrases. If a result that
   * would otherwise have matched, contains one or more terms or phrases, it
   * will not be included in the result set.
  **/
  NOTS?: any,
}

export function buildQuery(query: query): any {
  const collections: any = buildCollections(query.collections)

  return collections
}
