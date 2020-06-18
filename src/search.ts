const arangojs = require('arangojs')
const aql = arangojs.aql
import {query, collection, term} from './lib/structs'
import {parseQuery} from './parse'


export function buildSearch(query: query): any {
  query.terms = typeof query.terms == 'string'
    ? parseQuery(query.terms)
    : query.terms
  let ANDS = buildOPS(query.collections, query.terms, '+')
  let ORS = buildOPS(query.collections, query.terms, '?')
  return [ANDS, ORS]
}

function buildOPS(collections: collection[], terms: term[], op: string): any {
  const opWord: string = op == '+' ? ' AND ' : ' OR '

  let queryTerms: any = terms.filter((t: {op: string}) => t.op === op)
  if (!queryTerms.length) return

  /*phrases*/
  let phrases = queryTerms.filter((qT: {type: string}) => qT.type == 'phr')
    .map((phrase: any) => buildPhrase(phrase, collections))
  if (!phrases.length) {
    phrases = undefined
  } else {
    phrases = aql.join(phrases, opWord)
  }

  let tokens = queryTerms.filter((qT: {type: string}) => qT.type === 'tok')
  tokens = tokens && buildTokens(tokens, collections)

  if (!phrases && !tokens) return
  if (op == '-') return {phrases, tokens}
  if (phrases && tokens) return aql.join([phrases, tokens], opWord)
  return (tokens || phrases)
}

function buildPhrase(phrase: term, collections: collection[]): any {
  return collections.map(coll => {
    return aql`PHRASE(doc.text, ${phrase.val.slice(1, -1)}, ${coll.analyzer}`
  })
}

function buildTokens(tokens: term[], collections: collection[]): any {
  if (!tokens.length) return

  const opWordMap = {
    '+': 'ALL',
    '?': 'ANY',
    '-': 'NONE',
  }

  const mapped = tokens.reduce((a, v) => {
    const op = a[opWordMap[v.op]]
    a[opWordMap[v.op]] = op ? op + ' ' + v.val : v.val
    return a
  }, {})

  const makeTokenAnalyzers = (tokens: term[], op: string, analyzer: string, field: string) => {
    return aql`
      ANALYZER(
        TOKENS(${tokens}, ${analyzer})
        ${aql.literal(op)} IN doc.${field}, ${analyzer})`
  }

  let remapped = []
  collections.forEach(coll => {
    remapped.push(
      ...Object.keys(mapped).map(op => makeTokenAnalyzers(mapped[op], op, coll.analyzer, 'text'))
    )
  })

  return aql`MIN_MATCH(${aql.join(remapped, ', ')}, 
    ${tokens[0].op === '-' ? collections.length : 1})`
}
