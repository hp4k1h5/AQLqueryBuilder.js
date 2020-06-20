import { expect } from 'chai'
import { buildSearch } from '../src/search'

describe('search.js', () => {
    it('should export a function named buildSearch', () => {
        expect(buildSearch).to.be.a('function')
    })

    it(`should return SEARCH true 
      when terms: is an empty string or array`, () => {

        /* empty string */
        let empty_string_query = { view: 'search_view', collections: [{ name: 'coll', analyzer: 'text_en' }], terms: '' }
        const builtSearch = buildSearch(empty_string_query)

        expect(builtSearch).to.be.an('object')
        expect(Object.keys(builtSearch.bindVars)).to.have.length(2)
        expect(builtSearch.bindVars.value0).to.equal(true)
        expect(builtSearch.bindVars.value1).to.deep.equal({ collections: ['coll'] })

        /* empty array */
        let empty_array_query = { view: 'search_view', collections: [{ name: 'coll', analyzer: 'text_en' }], terms: [] }
        const builtSearch_from_array = buildSearch(empty_array_query)

        expect(builtSearch_from_array.bindVars.value0).to.equal(true)
    })

    it(`should handle single phrase queries`, () => {
        const query = { view: 'search_view', collections: [{ name: 'coll', analyzer: 'text_en' }], terms: '"complex phrase"' }
        const builtSearch = buildSearch(query)

        expect(builtSearch.query).to.equal(`
  SEARCH 
     
    (PHRASE(doc.@value0, @value1, @value2))
    
    
    OPTIONS @value3
      SORT TFIDF(doc) DESC`)
    })

    it(`should return an array of aql objects
     when a complex query is passed`, () => {
        const query = { view: 'search_view', collections: [{ name: 'coll', analyzer: 'text_en' }], terms: '-a +"query string" ?token' }
        const builtSearch = buildSearch(query)

        expect(Object.keys(builtSearch.bindVars)).to.have.length(7)
        expect(builtSearch.bindVars.value0).to.deep.equal('text')
        expect(builtSearch.bindVars.value1).to.deep.equal('query string')
        expect(builtSearch.bindVars.value2).to.deep.equal('text_en')
        expect(builtSearch.bindVars.value4).to.deep.equal(1)
        expect(builtSearch.bindVars.value5).to.deep.equal('a')
        expect(builtSearch.bindVars.value6).to.deep.equal({ collections: [query.collections[0].name] })
        expect(builtSearch.query).to.equal(`
  SEARCH 
    (PHRASE(doc.@value0, @value1, @value2)) OR ((PHRASE(doc.@value0, @value1, @value2)) AND MIN_MATCH(
      ANALYZER(
        TOKENS(@value3, @value2)
        ANY IN doc.@value0, @value2), 
    @value4)) 
    
     AND  
     
     MIN_MATCH(
      ANALYZER(
        TOKENS(@value5, @value2)
        NONE IN doc.@value0, @value2), 
    @value4)
    
    OPTIONS @value6
      SORT TFIDF(doc) DESC`)
    })

    it('should return an array of aql objects', () => {
        const query = {
            view: 'search_view',
            collections: [{
                name: 'coll',
                analyzer: 'text_en'
            }],
            terms: '+mandatory -exclude ?"optional phrase"'
        }
        const builtSearch = buildSearch(query)
        expect(builtSearch.query).to.equal(`
  SEARCH 
    MIN_MATCH(
      ANALYZER(
        TOKENS(@value0, @value1)
        ALL IN doc.@value2, @value1), 
    @value3) OR (MIN_MATCH(
      ANALYZER(
        TOKENS(@value0, @value1)
        ALL IN doc.@value2, @value1), 
    @value3) AND (PHRASE(doc.@value2, @value4, @value1))) 
    
     AND  
     
     MIN_MATCH(
      ANALYZER(
        TOKENS(@value5, @value1)
        NONE IN doc.@value2, @value1), 
    @value3)
    
    OPTIONS @value6
      SORT TFIDF(doc) DESC`)
    })

    it('should handle exclude phrase', () => {
        const query = {
            view: 'search_view',
            collections: [{
                name: 'coll',
                analyzer: 'text_en'
            }],
            terms: '-"exclude"'
        }
        const builtSearch = buildSearch(query)
        expect(builtSearch.query).to.equal(`
  SEARCH 
     
    
     
     NOT  (PHRASE(doc.@value0, @value1, @value2))
     
    
    OPTIONS @value3
      SORT TFIDF(doc) DESC`)
    })

    it('should handle exclude token', () => {
        const query = {
            view: 'search_view',
            collections: [{
                name: 'coll',
                analyzer: 'text_en'
            }],
            terms: '-exclude'
        }
        const builtSearch = buildSearch(query)
        expect(builtSearch.bindVars.value0).to.equal('exclude')
        expect(builtSearch.bindVars.value1).to.equal('text_en')
        expect(builtSearch.bindVars.value2).to.equal('text')
        expect(builtSearch.bindVars.value3).to.equal(1)
        expect(builtSearch.query).to.equal(`
  SEARCH 
     
    
     
     
     MIN_MATCH(
      ANALYZER(
        TOKENS(@value0, @value1)
        NONE IN doc.@value2, @value1), 
    @value3)
    
    OPTIONS @value4
      SORT TFIDF(doc) DESC`)
    })
})
