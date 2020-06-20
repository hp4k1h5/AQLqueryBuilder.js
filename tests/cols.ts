import { expect } from 'chai'

import { buildAQL } from '../src/index'

describe('multiple collections', () => {
  it(`should return an aql object
     when multiple collections are passed TOKEN`, () => {
    let query = {
      view: 'view',
      collections: [
        { name: 'coll1', analyzer: 'analyzer1' },
        { name: 'coll2', analyzer: 'analyzer2' },
      ],
      terms: 'hope',
    }
    const builtAQL = buildAQL(query)

    expect(builtAQL).to.be.an('object')
    expect(builtAQL.query).to.equal(`
    FOR doc IN view
      
  SEARCH 
     
    MIN_MATCH(
      ANALYZER(
        TOKENS(@value0, @value1)
        ANY IN doc.@value2, @value1), 
      ANALYZER(
        TOKENS(@value0, @value3)
        ANY IN doc.@value2, @value3), 
    @value4)
    
    
    OPTIONS @value5
      SORT TFIDF(doc) DESC
      
      LIMIT @value6, @value7
    RETURN doc`)
  })

  it(`should return an aql object
     when a PHRASE is passed`, () => {
    let query = {
      view: 'view',
      collections: [
        { name: 'coll1', analyzer: 'analyzer1' },
        { name: 'coll2', analyzer: 'analyzer2' },
      ],
      terms: '-"springs eternal"',
    }
    const builtAQL = buildAQL(query)
    expect(builtAQL).to.be.an('object')

    expect(builtAQL.query).to.equal(`
    FOR doc IN view
      
  SEARCH 
     
    
     
     NOT  (PHRASE(doc.@value0, @value1, @value2) OR PHRASE(doc.@value0, @value1, @value3))
     
    
    OPTIONS @value4
      SORT TFIDF(doc) DESC
      
      LIMIT @value5, @value6
    RETURN doc`)
  })

  it(`should return an aql object
     when TOKENs are passed to multiple collections`, () => {
    let query = {
      view: 'view',
      collections: [
        { name: 'coll1', analyzer: 'analyzer1' },
        { name: 'coll2', analyzer: 'analyzer2' },
      ],
      terms: 'hope',
    }
    const builtAQL = buildAQL(query)

    expect(builtAQL).to.be.an('object')
    expect(builtAQL.query).to.equal(`
    FOR doc IN view
      
  SEARCH 
     
    MIN_MATCH(
      ANALYZER(
        TOKENS(@value0, @value3)
        ANY IN doc.@value2, @value3), 
      ANALYZER(
        TOKENS(@value0, @value3)
        ANY IN doc.@value2, @value3), 
    @value4)
    
    
    OPTIONS @value5
      SORT TFIDF(doc) DESC
      
      LIMIT @value6, @value7
    RETURN doc`)
  })

  it.skip(`should return an aql object
     when a phrase string is passed for query terms`, () => {
    let query = {
      view: 'view',
      collections: [ { name: 'coll', analyzer: 'analyzer' } ],
      terms: '"phrase search"',
    }
    const builtAQL = buildAQL(query)
    expect(builtAQL).to.be.an('object')

    expect(builtAQL.query).to.equal(`\n    FOR doc IN view\n      \n  SEARCH \n     \n    MIN_MATCH(\n      ANALYZER(\n        TOKENS(@value0, @value1)\n        ANY IN doc.@value2, @value1), \n      ANALYZER(\n        TOKENS(@value0, @value3)\n        ANY IN doc.@value2, @value3), \n    @value4)\n    \n    \n    OPTIONS @value5\n      SORT TFIDF(doc) DESC\n      \n      LIMIT @value6, @value7\n    RETURN doc`
    )
  })

  it.skip(`should handle basic boolean cases`, () => {
    let query = {
      view: 'view',
      collections: [ { name: 'coll', analyzer: 'analyzer' } ],
      terms: '-"hope"',
    }

    const builtAQL = buildAQL(query)
    expect(builtAQL).to.be.an('object')
    expect(builtAQL.query).to.equal(`
    FOR doc IN view
      
  SEARCH 
     
    
     
     NOT  (PHRASE(doc.@value0, @value1, @value2))
     
    
    OPTIONS @value3
      SORT TFIDF(doc) DESC
      
      LIMIT @value4, @value5
    RETURN doc`)
  })

  it.skip(`should handle basic boolean cases`, () => {
    let query = {
      view: 'view',
      collections: [ { name: 'coll', analyzer: 'analyzer' } ],
      terms: '-hope',
    }

    const builtAQL = buildAQL(query)
    expect(builtAQL).to.be.an('object')
    expect(builtAQL.query).to.equal(`
    FOR doc IN view
      
  SEARCH 
     
    
     
     
     MIN_MATCH(
      ANALYZER(
        TOKENS(@value0, @value1)
        NONE IN doc.@value2, @value1), 
    @value3)
    
    OPTIONS @value4
      SORT TFIDF(doc) DESC
      
      LIMIT @value5, @value6
    RETURN doc`)
  })
})
