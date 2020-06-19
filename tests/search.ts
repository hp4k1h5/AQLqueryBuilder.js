import { expect } from 'chai'
import { buildSearch } from '../src/search'

describe('search.js', () => {
    it('should export a function named buildSearch', () => {
        expect(buildSearch).to.be.a('function')
    })

    it('should return SEARCH true when terms: is an empty string', () => {
        const query = { view: 'search_view', collections: [{ name: 'coll', analyzer: 'text_en' }], terms: '' }
        const builtSearch = buildSearch(query)

        expect(builtSearch).to.be.an('object')
        expect(Object.keys(builtSearch.bindVars)).to.have.length(2)
        expect(builtSearch.bindVars.value0).to.equal(true)
        expect(builtSearch.bindVars.value1).to.deep.equal({ collections: ['coll'] })
    })

    it('should return an array of aql objects', () => {
        const query = { view: 'search_view', collections: [{ name: 'coll', analyzer: 'text_en' }], terms: '-a +"query string" ?token' }
        const builtSearch = buildSearch(query)

        expect(Object.keys(builtSearch.bindVars)).to.have.length(7)
        expect(builtSearch.bindVars.value0[0].query).to.equal('PHRASE(doc.text, @value0, @value1)')
        expect(builtSearch.bindVars.value1).to.deep.equal('token')
        expect(builtSearch.bindVars.value2).to.deep.equal('text_en')
        expect(builtSearch.bindVars.value3).to.deep.equal('text')
        expect(builtSearch.bindVars.value4).to.deep.equal(1)
        expect(builtSearch.bindVars.value5).to.deep.equal('a')
        expect(builtSearch.bindVars.value6).to.deep.equal({ collections: [query.collections[0].name] })
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
