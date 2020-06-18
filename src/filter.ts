import { aql } from 'arangojs'
import { filter } from './lib/structs'

export function buildFilters(filters: filter[]) {
  if (!filters.length) return

  let _filters = filters.map(
    (f: filter) => aql`doc.${f.field} ${aql.literal(f.op)} ${f.val}`,
  )

  return aql`FILTER ${aql.join(_filters, ' && ')}`
}
