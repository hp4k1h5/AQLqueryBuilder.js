import {buildCollections} from './collections'

export interface query {
  collections: any,
  terms: any,
  filters: any,
}

export function buildQuery(query: query): any {
  const collections: any = buildCollections(query.collections)

  return collections
}
