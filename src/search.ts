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

  let analyzers = queryTerms.filter((qT: {type: string}) => qT.type === 'ana')
  analyzers = analyzers && buildAnalyzer(analyzers, collections, op)

  if (!phrases && !analyzers) return
  if (op == '-') return {phrases, analyzers}
  if (phrases && analyzers) return aql.join([phrases, analyzers], opWord)
  return !phrases ? analyzers : phrases
}

function buildPhrase(phrase: any, collections: collection[]): any {
  return collections.map(coll => {
    return aql`PHRASE(doc.text, ${phrase.val.slice(1, -1)}, ${coll.analyzer}`
  })
}

function buildAnalyzer(analyzers: any, collections: string[], op: string): any {
  return
}
