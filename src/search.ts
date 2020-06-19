import { aql } from 'arangojs'
import { query, collection, term } from './lib/structs'
import { parseQuery } from './parse'


export function buildSearch(query: query): any {
  /* parse string query */
  query.terms = typeof query.terms == 'string'
    ? parseQuery(query.terms)
    : query.terms

  /* build boolean pieces */
  let ANDS = buildOPS(query.collections, query.terms, '+', query.key)
  let ORS = buildOPS(query.collections, query.terms, '?', query.key)
  let NOTS = buildOPS(query.collections, query.terms, '-', query.key)

  /* handle combinations */
  if (ANDS && ORS) {
    ANDS = aql`${ANDS} OR (${ANDS} AND ${ORS})`
    ORS = undefined
  }
  if (!!NOTS) {
    NOTS = aql`${ANDS || ORS ? aql.literal(' AND ') : undefined} 
    ${NOTS.phrs ? aql.literal(' NOT ') : undefined} ${NOTS.phrs}
    ${NOTS.phrs && NOTS.tokens ? aql.literal(' AND ') : undefined} ${NOTS.tokens}`
  }

  /* if an empty query.terms string or array is passed, SEARCH true, bringing
   * back all documents in view */
  return aql`
  SEARCH 
    ${ANDS} 
    ${ORS}
    ${NOTS}
    ${(!ANDS && !ORS && !NOTS) || undefined}
    OPTIONS ${{ collections: query.collections.map(c => c.name) }}
      SORT TFIDF(doc) DESC`
}

function buildOPS(collections: collection[], terms: term[], op: string, key:
  string = 'text'): any {
  const opWord: string = op == '+' ? ' AND ' : ' OR '

  let queryTerms: any = terms.filter((t: term) => t.op == op)
  if (!queryTerms.length) return

  /* phrases */
  let phrases = queryTerms.filter((qT: term) => qT.type == 'phr')
    .map((phrase: any) => buildPhrase(phrase, collections, key))
  if (!phrases.length) {
    phrases = undefined
  } else {
    phrases = aql.join(phrases, opWord)
  }

  /* tokens */
  let tokens = queryTerms.filter((qT: { type: string }) => qT.type === 'tok')
  tokens = tokens && buildTokens(tokens, collections, key)

  if (!phrases && !tokens) return
  if (op == '-') return { phrases, tokens }
  if (phrases && tokens) return aql.join([ phrases, tokens ], opWord)
  return (tokens || phrases)
}

function buildPhrase(phrase: term, collections: collection[], key: string): any {
  return collections.map(coll => {
    return aql`PHRASE(doc.${key}, ${phrase.val.slice(1, -1)}, ${coll.analyzer})`
  })
}

function buildTokens(tokens: term[], collections: collection[], key: string): any {
  if (!tokens.length) return

  const opWordMap = {
    '+': 'ALL',
    '?': 'ANY',
    '-': 'NONE',
  }

  const mapped = tokens.reduce((a, v) => {
    const op = a[ opWordMap[ v.op ] ]
    a[ opWordMap[ v.op ] ] = op ? op + ' ' + v.val : v.val
    return a
  }, {})

  const makeTokenAnalyzers = (tokens: term[], op: string, analyzer: string,
    key: string) => {
    return aql`
      ANALYZER(
        TOKENS(${tokens}, ${analyzer})
        ${aql.literal(op)} IN doc.${key}, ${analyzer})`
  }

  let remapped = []
  collections.forEach(coll => {
    remapped.push(
      ...Object.keys(mapped).map(op => makeTokenAnalyzers(mapped[ op ], op,
        coll.analyzer, key))
    )
  })

  return aql`MIN_MATCH(${aql.join(remapped, ', ')}, 
    ${tokens[ 0 ].op === '-' ? collections.length : 1})`
}
