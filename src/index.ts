import { query } from './lib/structs'
import { buildSearch } from './search'
import { buildFilters } from './filter'

export function buildAQL(query: query): any {
  validateQuery(query)

  const SEARCH = buildSearch(query)
  const FILTER = buildFilters(query.filters)

  return query
}

function validateQuery(query: query) {
  if (!query.view.length) throw Error('query.view must be a valid ArangoSearch View name')
  if (!query.collections.length) throw new Error('query.collections must have at least one name')
}
