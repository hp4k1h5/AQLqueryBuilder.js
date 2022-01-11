import { aql } from 'arangojs'
import { Filter } from './lib/structs'

export function buildFilters(filters: Filter[]) {
  if (!filters.length) return

  let _filters = filters.map(
    (f: Filter) => aql`doc.${f.field} ${aql.literal(f.op)} ${f.val}`,
  )

  return aql`FILTER ${aql.join(_filters, ' && ')}`
}
