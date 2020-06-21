import { expect } from 'chai'

import { buildAQL } from '../src/index'

describe('buildAQL', () => {
  it(`should return an aql object
     when an empty string is passed for query terms`, () => {
    let query = { view: 'view', collections: [ { name: 'coll', analyzer: 'analyzer' } ], terms: '' }
    const builtAQL = buildAQL(query)
    expect(builtAQL).to.be.an('object')

    expect(builtAQL.query).to.equal(`
    FOR doc IN view
      
  SEARCH 
     
    
    
    @value0
    OPTIONS @value1
      SORT TFIDF(doc) DESC
      
      LIMIT @value2, @value3
    RETURN doc`
    )
  })

  it(`should return an aql object
     when an empty array is passed for query terms`, () => {
    let query = { view: 'view', collections: [ { name: 'coll', analyzer: 'analyzer' } ], terms: [] }
    const builtAQL = buildAQL(query)
    expect(builtAQL).to.be.an('object')

    expect(builtAQL.query).to.equal(`
    FOR doc IN view
      
  SEARCH 
     
    
    
    @value0
    OPTIONS @value1
      SORT TFIDF(doc) DESC
      
      LIMIT @value2, @value3
    RETURN doc`
    )
  })

  it(`should return an aql object
     when a phrase string is passed for query terms`, () => {
    let query = { view: 'view', collections: [ { name: 'coll', analyzer: 'analyzer' } ], terms: '"phrase search"' }
    const builtAQL = buildAQL(query)
    expect(builtAQL).to.be.an('object')

    expect(builtAQL.query).to.equal(`
    FOR doc IN view
      
  SEARCH 
     
    (PHRASE(doc.@value0, @value1, @value2))
    
    
    OPTIONS @value3
      SORT TFIDF(doc) DESC
      
      LIMIT @value4, @value5
    RETURN doc`)
  })

  it(`should handle basic boolean cases`, () => {
    let query = { view: 'view', collections: [ { name: 'coll', analyzer: 'analyzer' } ], terms: '-"hope"' }

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

  it(`should handle basic boolean cases`, () => {
    let query = { view: 'view', collections: [ { name: 'coll', analyzer: 'analyzer' } ], terms: '-hope' }

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
