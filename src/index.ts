import {buildCollections} from './collections'

export interface query {
  view: string,
  collections: any,
  terms: any,
  filters: any,
}

export function buildQuery(query: query): any {
  const collections: any = buildCollections(query.collections)

  return collections
}
