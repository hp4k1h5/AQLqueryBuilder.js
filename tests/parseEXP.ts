import { expect } from 'chai'
import { parseQueryEXP } from '../src/parse'

describe('parse.ts', () => {
  it('should export a function parseQueryEXP', () => {
    expect(parseQueryEXP).to.be.a('function')
  })

  it(`should return an an empty array 
     when an empty string is passed`, () => {
    expect(parseQueryEXP('')).to.be.an('array')
  })

  it(`should return an array of parsed optional term objects 
     when a string is passed with no op hints`, () => {
    const parsedQuery = parseQueryEXP('terms "a and b" c')
    expect(parsedQuery).to.be.an('array').that.has.lengthOf(3)
    expect(parsedQuery[0]).to.deep.equal({
      op: '?',
      type: 'tok',
      val: 'terms',
    })
    expect(parsedQuery[1]).to.deep.equal({
      op: '?',
      type: 'phr',
      val: 'a and b',
    })
  })

  it(`should return an array of parsed term objects 
     when a complex string is passed`, () => {
    const parsedQuery = parseQueryEXP('terms +"must have" -cannot -"have this"')

    expect(parsedQuery).to.be.an('array').that.has.lengthOf(4)

    expect(parsedQuery[0]).to.deep.equal({
      op: '?',
      type: 'tok',
      val: 'terms',
    })

    expect(parsedQuery[1]).to.deep.equal({
      op: '+',
      type: 'phr',
      val: 'must have',
    })

    expect(parsedQuery[2]).to.deep.equal({
      op: '-',
      type: 'tok',
      val: 'cannot',
    })

    expect(parsedQuery[3]).to.deep.equal({
      op: '-',
      type: 'phr',
      val: 'have this',
    })
  })
})
