import { expect } from 'chai'
import { buildSearch } from '../src/search'

describe('whitespaces', () => {
  describe(`all of these queries are the same as those found in tests/search.ts
         with the exception that all have been modified to include various
         whitespace combinations`, () => {
    it(`should handle single phrase queries
       with whitespace`, () => {
      const query = {
        view: 'search_view',
        collections: [ { name: 'coll', analyzer: 'text_en' } ],
        terms: '  " complex    phrase "  ',
      }
      const builtSearch = buildSearch(query)

      expect(builtSearch.query).to.equal(`
  SEARCH 
     
    (PHRASE(doc.@value0, @value1, @value2))
    
    
    OPTIONS @value3
      SORT TFIDF(doc) DESC`)
    })

    it(`should return an array of aql objects
     when a complex query is passed
     with whitespaces`, () => {
      const query = {
        view: 'search_view',
        collections: [ { name: 'coll', analyzer: 'text_en' } ],
        terms: '  -a   +"query    string " ?token   ',
      }
      const builtSearch = buildSearch(query)

      expect(Object.keys(builtSearch.bindVars)).to.have.length(7)
      expect(builtSearch.bindVars.value0).to.deep.equal('text')
      expect(builtSearch.bindVars.value1).to.deep.equal('query    string ')
      expect(builtSearch.bindVars.value2).to.deep.equal('text_en')
      expect(builtSearch.bindVars.value4).to.deep.equal(1)
      expect(builtSearch.bindVars.value5).to.deep.equal('a')
      expect(builtSearch.bindVars.value6).to.deep.equal({
        collections: [ query.collections[ 0 ].name ],
      })
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

    it(`should return an array of aql objects
            whhen complex query is passed with whitespaces`, () => {
      const query = {
        view: 'search_view',
        collections: [
          {
            name: 'coll',
            analyzer: 'text_en',
          },
        ],
        terms: '   +mandatory  -exclude     ?" optional  phrase "',
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

    it(`should handle exclude phrase
            when whitespaces are included`, () => {
      const query = {
        view: 'search_view',
        collections: [
          {
            name: 'coll',
            analyzer: 'text_en',
          },
        ],
        terms: '  -"  exclude  "',
      }
      const builtSearch = buildSearch(query)
      expect(builtSearch.query).to.equal(`
  SEARCH 
     
    
     
     NOT  (PHRASE(doc.@value0, @value1, @value2))
     
    
    OPTIONS @value3
      SORT TFIDF(doc) DESC`)
    })

    it(`should handle exclude token
            when whitespaces are included`, () => {
      const query = {
        view: 'search_view',
        collections: [
          {
            name: 'coll',
            analyzer: 'text_en',
          },
        ],
        terms: '   -exclude   ',
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
})
