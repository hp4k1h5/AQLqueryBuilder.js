import { expect } from 'chai'
import { buildSearch } from '../src/search'

describe('search.js', () => {
  it('should export a function named buildSearch', () => {
    expect(buildSearch).to.be.a('function')
  })

  it('should return an array of aql objects', () => {
    const query = { view: 'search_view', collections: [ { name: 'coll', analyzer: 'text_en' } ], terms: '-a +"query string" ?token' }
    const builtSearch = buildSearch(query)
    expect(builtSearch).to.be.an('object')

    expect(builtSearch.query).to.equal(`
  SEARCH 
    @value0 OR (@value0 AND MIN_MATCH(
      ANALYZER(
        TOKENS(@value1, @value2)
        ANY IN doc.@value3, @value2), 
    @value4)) 
    
     AND  
     
     MIN_MATCH(
      ANALYZER(
        TOKENS(@value5, @value2)
        NONE IN doc.@value3, @value2), 
    @value4)
    
    OPTIONS @value6
      SORT TFIDF(doc) DESC`)
  })
})
