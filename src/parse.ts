import { Term, Type, Operator, Char } from './lib/structs'

export function parseQuery(queryString: string): Term[] {
  const queryRgx: RegExp = /[+?-]?(["'(]).+?(\1|\))|[^"'()\s]+/g

  let matches = queryString.match(queryRgx)
  if (!matches) return []

  return matches.map((match) => {
    /* strip op */
    let op = Operator.OR
    if (/[+?-]/.test(match[0])) {
      op = Operator[match[0]]
      match = match.substring(1)
    }

    if (match[0] == '"' || match[0] == "'") {
      return {
        type: Type.phrase,
        val: match,
        op,
      }
    } else {
      return {
        type: Type.token,
        val: match,
        op,
      }
    }
  })
}

export function parseQueryEXP(queryString: string): Term[] {
  return lex(queryString)
}

function lex(queryString: string) {
  const lexes = []
  let curToken = ''
  let curTokenType: Type = Type.token
  let curOperator: Operator = Operator.OR
  let isToken = false

  for (let i = 0; i < queryString.length; i++) {
    const ch = new Char(queryString[i])
    if (ch.isSpace()) {
      if (curToken.length) {
        if (curTokenType === Type.token) {
          isToken = true
        } else {
          curToken += ch.char
        }
      }
    } else if (ch.isOperator()) {
      if (curToken.length) {
        throw new ParseError(
          ch.char,
          i,
          `Logical operator must precede query term.`,
        )
      }
      curOperator = Operator[ch.char]
    } else if (ch.isQuote()) {
      if (curToken.length && curTokenType === Type.phrase) {
        isToken = true
      } else {
        curTokenType = Type.phrase
      }
    } else {
      curToken += ch.char
    }

    if (isToken) {
      resetCur()
    }
  }
  if (curToken.length) {
    resetCur()
  }

  function resetCur() {
    lexes.push({
      type: curTokenType,
      val: curToken,
      op: curOperator,
    })
    curToken = ''
    curTokenType = Type.token
    curOperator = Operator.OR
    isToken = false
  }

  return lexes
}

export class ParseError extends Error {
  char: string
  pos: number
  constructor(char: string, pos: number, message: string) {
    super(message)
    this.char = char
    this.pos = pos
  }

  print() {
    return `err:  “ ${this.char} ” in position ${this.pos} ${this.message}`
  }
  // U+201C “
  // U+201D ”
}
