import { aql, literal, join } from 'arangojs/aql'
import { Query, Collection, Term, Type } from './lib/structs'
import { parseQuery } from './parse'

export function buildSearch(query: Query): any {
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
    NOTS = aql`${ANDS || ORS ? literal(' AND ') : undefined} 
    ${NOTS.phrases ? literal(' NOT ') : undefined} ${NOTS.phrases}
    ${NOTS.phrases && NOTS.tokens ? literal(' AND ') : undefined} ${
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
function buildOps(collections: Collection[], terms: Term[], op: string): any {
  const opWord: string = op == '+' ? ' AND ' : ' OR '

  let queryTerms: any = terms.filter((t: Term) => t.op == op)
  if (!queryTerms.length) return

  /* phrases */
  let phrases = queryTerms.filter((qT: Term) => qT.type == Type.phrase)
  phrases = buildPhrases(phrases, collections, opWord)

  /* tokens */
  let tokens = queryTerms.filter((qT: { type: string }) => qT.type === 'tok')
  tokens = tokens && buildTokens(tokens, collections)

  /* if (!phrases && !tokens) return */
  if (op == '-') return { phrases, tokens }
  if (phrases && tokens) return join([phrases, tokens], opWord)
  return tokens || phrases
}

function buildPhrases(
  phrases: Term[],
  collections: Collection[],
  opWord: string,
): any {
  if (!phrases.length) return undefined

  return join(
    phrases.map((phrase: any) => buildPhrase(phrase, collections)),
    opWord,
  )
}

function buildPhrase(phrase: Term, collections: Collection[]): any {
  const phrases = []
  collections.forEach((coll) =>
    coll.keys.forEach((k: string) =>
      phrases.push(
        aql`PHRASE(doc.${k}, ${phrase.val.slice(1, -1)}, ${coll.analyzer})`,
      ),
    ),
  )
  return aql`(${join(phrases, ' OR ')})`
}

function buildTokens(tokens: Term[], collections: Collection[]): any {
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
    tokens: Term[],
    op: string,
    analyzer: string,
    keys: string[],
  ) => {
    return join(
      keys.map(
        (k) => aql`
      ANALYZER(
        TOKENS(${tokens}, ${analyzer})
        ${literal(op)} IN doc.${k}, ${analyzer})`,
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

  return aql`MIN_MATCH(${join(remapped, ', ')}, 
    ${tokens[0].op === '-' ? collections.length : 1})`
}
