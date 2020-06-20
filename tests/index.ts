import { expect } from 'chai'

import { buildAQL } from '../src/index'

describe('index.ts', () => {
  it('should export a function named buildAQL', () => {
    expect(buildAQL).to.exist
    expect(buildAQL).to.be.a('function')
  })

  it('should validate the query', () => {
    expect(() => buildAQL({ view: '', collections: [], terms: [] })).to.throw(/query.view must be a valid ArangoSearch View name/)

    expect(() => buildAQL({ view: 'view', collections: [], terms: [] })).to.throw(/query.collections must have at least one name/)
  })
})

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
})
