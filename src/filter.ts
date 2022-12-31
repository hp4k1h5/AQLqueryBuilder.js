import { aql, literal, join } from 'arangojs/aql'
import { Filter } from './lib/structs'

export function buildFilters(filters: Filter[]) {
  if (!filters.length) return

  let _filters = filters.map(
    (f: Filter) => aql`doc.${f.field} ${literal(f.op)} ${f.val}`,
  )

  return aql`FILTER ${join(_filters, ' && ')}`
}
