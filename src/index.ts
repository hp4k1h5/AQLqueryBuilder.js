import {query} from './lib/structs'
import {buildSearch} from './search'

export function buildAQL(query: query): any {
  validateQuery(query)

  const SEARCH = buildSearch(query)
  return query
}

function validateQuery(query: query) {
  if (!query.view.length) throw Error('query.view must be a valid ArangoSearch View name')
  if (!query.collections.length) throw new Error('query.collections must have at least one name')
}
