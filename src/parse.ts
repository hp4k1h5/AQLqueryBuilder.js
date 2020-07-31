import { term } from './lib/structs'

export function parseQuery(queryString: string): term[] {
  const queryRgx: RegExp = /[+?-]?(["'(]).+?(\1|\))|[^"'()\s]+/g

  let matches = queryString.match(queryRgx)
  if (!matches) return []

  return matches.map((match) => {
    /* strip op */
    let op = '?'
    if (/[+?-]/.test(match[0])) {
      op = match[0]
      match = match.substring(1)
    }

    if (match[0] == '"' || match[0] == "'") {
      return {
        type: 'phr',
        val: match,
        op,
      }
    } else {
      return {
        type: 'tok',
        val: match,
        op,
      }
    }
  })
}
