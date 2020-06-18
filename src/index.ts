import {query} from './lib/structs'

export function buildQuery(query: query): any {
  validateQuery(query)

  return query.collections
}

function validateQuery(query: query) {
  if (!query.view.length) throw Error('query.view must be a valid ArangoSearch View name')
  if (!query.collections.length) throw new Error('query.collections must have at least one name')
}
