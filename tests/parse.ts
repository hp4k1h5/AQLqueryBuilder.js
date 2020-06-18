import {expect} from 'chai'
import {parseQuery} from '../src/parse'

describe('parse.ts', () => {
  it('should export a function parseQuery', () => {
    expect(parseQuery).to.be.a('function')
  })

  it('should return an an empty array when an empty string is passed', () => {
    expect(parseQuery('')).to.be.an('array')
  })

  it('should return an array of optional term objects when a simple string is passed', () => {
    const parsedQuery = parseQuery('term a and b')
    expect(parsedQuery).to.be.an('array').that.has.lengthOf(4)
    expect(parsedQuery[0]).to.deep.equal({
      op: "?",
      type: "ana",
      val: "term",
    })
  })

  it('should return an array of optional term objects when a complex string is passed', () => {
    const parsedQuery = parseQuery('terms "a and b"')
    expect(parsedQuery).to.be.an('array').that.has.lengthOf(2)
    expect(parsedQuery[1]).to.deep.equal({
      op: "?",
      type: "phr",
      val: '"a and b"',
    })
  })
})
