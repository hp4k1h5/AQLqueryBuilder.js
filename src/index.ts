import { aql } from 'arangojs'
import { query } from './lib/structs'
import { buildSearch } from './search'
import { buildFilters } from './filter'

/** @returns an AQL query object. See @param query for details on required
 * values. @parm query .terms accepts either a string to be parsed or an array of @param term
 * */
export function buildAQL(query: query, limit: any = { start: 0, end: 20 }): any {
  validateQuery(query)

  const SEARCH = buildSearch(query)
  const FILTER = query.filters && buildFilters(query.filters)

  /* FOR doc IN ${query.view} */
  return aql`
    FOR doc IN ${aql.literal(query.view)}
      ${SEARCH}
      ${FILTER}
      LIMIT ${limit.start}, ${limit.end}
    RETURN doc`
}

function validateQuery(query: query) {
  if (!query.view.length) throw Error('query.view must be a valid ArangoSearch View name')
  if (!query.collections.length) throw new Error('query.collections must have at least one name')
}
