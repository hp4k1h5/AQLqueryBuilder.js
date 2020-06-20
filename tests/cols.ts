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
     when a mixed query string 
     with multiple members and multiple collections is passed`, () => {
    let query = {
      view: 'view',
      collections: [ { name: 'coll', analyzer: 'analyzer' } ],
      terms: 'other +words -nor +"phrase search" -"not these" ?"could have"',
    }
    const builtAQL = buildAQL(query)
    expect(builtAQL).to.be.an('object')

    expect(builtAQL.query).to.equal(`
    FOR doc IN view
      
  SEARCH 
    (PHRASE(doc.@value0, @value1, @value2)) AND MIN_MATCH(
      ANALYZER(
        TOKENS(@value3, @value2)
        ALL IN doc.@value0, @value2), 
    @value4) OR ((PHRASE(doc.@value0, @value1, @value2)) AND MIN_MATCH(
      ANALYZER(
        TOKENS(@value3, @value2)
        ALL IN doc.@value0, @value2), 
    @value4) AND (PHRASE(doc.@value0, @value5, @value2)) OR MIN_MATCH(
      ANALYZER(
        TOKENS(@value6, @value2)
        ANY IN doc.@value0, @value2), 
    @value4)) 
    
     AND  
     NOT  (PHRASE(doc.@value0, @value7, @value2))
     AND  MIN_MATCH(
      ANALYZER(
        TOKENS(@value8, @value2)
        NONE IN doc.@value0, @value2), 
    @value4)
    
    OPTIONS @value9
      SORT TFIDF(doc) DESC
      
      LIMIT @value10, @value11
    RETURN doc`
    )

    expect(builtAQL.bindVars).to.deep.equal({
      "value0": "text",
      "value1": "phrase search",
      "value10": 0,
      "value11": 20,
      "value2": "analyzer",
      "value3": "words",
      "value4": 1,
      "value5": "could have",
      "value6": "other",
      "value7": "not these",
      "value8": "nor",
      "value9": {
        "collections": [
          "coll"
        ]
      }
    })
  })

})
