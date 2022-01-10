import { aql } from 'arangojs'
import { query, collection, term } from './lib/structs'
import { parseQuery } from './parse'

export function buildSearch(query: query): any {
  /* parse string query */
  query.terms =
    typeof query.terms == 'string' ? parseQuery(query.terms) : query.terms

  /* build boolean pieces */
  let ANDS = buildOps(query.collections, query.terms, '+')
  let ORS = buildOps(query.collections, query.terms, '?')
  let NOTS = buildOps(query.collections, query.terms, '-')

  /* handle combinations */
  if (ANDS && ORS) {
    ANDS = aql`${ANDS} OR (${ANDS} AND ${ORS})`
    ORS = undefined
  }
  if (!!NOTS) {
    NOTS = aql`${ANDS || ORS ? aql.literal(' AND ') : undefined} 
    ${NOTS.phrases ? aql.literal(' NOT ') : undefined} ${NOTS.phrases}
    ${NOTS.phrases && NOTS.tokens ? aql.literal(' AND ') : undefined} ${
      NOTS.tokens
    }`
  }
  const cols = query.collections.map((c) => c.name)
  /* if an empty query.terms string or array is passed, SEARCH true, bringing
   * back all documents in view */
  return aql`
  SEARCH 
    ${ANDS} 
    ${ORS}
    ${NOTS}
    ${(!ANDS && !ORS && !NOTS) || undefined}
      OPTIONS { collections: ${cols} }
      SORT TFIDF(doc) DESC`
}
function buildOps(collections: collection[], terms: term[], op: string): any {
  const opWord: string = op == '+' ? ' AND ' : ' OR '

  let queryTerms: any = terms.filter((t: term) => t.op == op)
  if (!queryTerms.length) return

  /* phrases */
  let phrases = queryTerms.filter((qT: term) => qT.type == 'phr')
  phrases = buildPhrases(phrases, collections, opWord)

  /* tokens */
  let tokens = queryTerms.filter((qT: { type: string }) => qT.type === 'tok')
  tokens = tokens && buildTokens(tokens, collections)

  /* if (!phrases && !tokens) return */
  if (op == '-') return { phrases, tokens }
  if (phrases && tokens) return aql.join([phrases, tokens], opWord)
  return tokens || phrases
}

function buildPhrases(
  phrases: term[],
  collections: collection[],
  opWord: string,
): any {
  if (!phrases.length) return undefined

  return aql.join(
    phrases.map((phrase: any) => buildPhrase(phrase, collections)),
    opWord,
  )
}

function buildPhrase(phrase: term, collections: collection[]): any {
  const phrases = []
  collections.forEach((coll) =>
    coll.keys.forEach((k: string) =>
      phrases.push(
        aql`PHRASE(doc.${k}, ${phrase.val.slice(1, -1)}, ${coll.analyzer})`,
      ),
    ),
  )
  return aql`(${aql.join(phrases, ' OR ')})`
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

  const makeTokenAnalyzers = (
    tokens: term[],
    op: string,
    analyzer: string,
    keys: string[],
  ) => {
    return aql.join(
      keys.map(
        (k) => aql`
      ANALYZER(
        TOKENS(${tokens}, ${analyzer})
        ${aql.literal(op)} IN doc.${k}, ${analyzer})`,
      ),
      ' OR ',
    )
  }

  let remapped = []
  collections.forEach((col) => {
    remapped.push(
      ...Object.keys(mapped).map((op) =>
        makeTokenAnalyzers(mapped[op], op, col.analyzer, col.keys),
      ),
    )
  })

  return aql`MIN_MATCH(${aql.join(remapped, ', ')}, 
    ${tokens[0].op === '-' ? collections.length : 1})`
}
