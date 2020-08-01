import { aql } from 'arangojs'
import { query } from './lib/structs'
import { buildSearch } from './search'
import { buildFilters } from './filter'
export { buildFilters } from './filter'
export { parseQuery } from './parse'

/** @returns an AQL query object. See @param query for details on required
 * values. @param query.terms accepts either a string to be parsed or an array
 * of terms.
 *
 * ! NOTE: v0.1.1 introduced a breaking change to adhere to the ArangoSearch
 * spec. Please refer to
 * <https://www.arangodb.com/docs/stable/aql/operations-limit.html> @param
 * limit is an object with keys `start` @default 0, and `count` @default 20 */
export function buildAQL(
  query: query,
  limit: any = { start: 0, count: 20 },
): any {
  validateQuery(query)
  collectKeys(query)

  const SEARCH = buildSearch(query)
  const FILTER = query.filters && buildFilters(query.filters)

  /* FOR doc IN ${query.view} */
  return aql`
    FOR doc IN ${aql.literal(query.view)}
      ${SEARCH}
      ${FILTER}
      LIMIT ${limit.start}, ${limit.count}
    RETURN doc`
}

function validateQuery(query: query) {
  if (!query.view.length)
    throw new Error('query.view must be a valid ArangoSearch View name')
  if (!query.collections.length)
    throw new Error('query.collections must have at least one name')
}

function collectKeys(query: query) {
  /* unify query.key */
  let _keys: string[]
  if (typeof query.key == 'string') {
    _keys = [query.key]
  } else if (!query.key) {
    _keys = ['text']
  } else _keys = query.key

  query.collections = query.collections.map((c) => {
    if (!c.keys) c.keys = _keys
    return c
  })
}
