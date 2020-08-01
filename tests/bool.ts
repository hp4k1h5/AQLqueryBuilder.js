import { expect } from 'chai'
import { Database, DocumentCollection, aql } from 'arangojs'

import { buildAQL } from '../src/index'

const ARANGO_URL = process.env.TEST_ARANGODB_URL || 'http://localhost:8529'

describe('boolean search logic', () => {
  let db: Database
  let collection: DocumentCollection<any>
  let view
  const dbName = `testdb_${Date.now()}`
  const collectionName = `coll_${Date.now()}`

  before(async () => {
    /* create db */
    db = new Database({ url: ARANGO_URL })
    await db.createDatabase(dbName)
    db.useDatabase(dbName)

    /* create coll */
    collection = db.collection(collectionName)
    await collection.create()

    /* create view */
    view = db.arangoSearchView(`view_${Date.now()}`)
    const links = {}
    links[collectionName] = {
      fields: {
        text_en: { analyzers: ['text_en'] },
        text_es: { analyzers: ['text_es'] },
      },
    }
    await view.create({ links })
    let info = await view.get()
    expect(info.name).to.equal(view.name)

    expect(info.error).to.deep.equal(false)
    expect(info.code).to.deep.equal(200)
    expect(info.name).to.deep.equal(view.name)
    expect(info.type).to.deep.equal('arangosearch')
    expect(+info.id).to.be.a('number')
    expect(info.globallyUniqueId).to.contain('/')

    /* add documents */
    const docA = {
      title: 'doc A',
      text_en: 'words in text in document',
      text_es: 'palabras en texto en documento',
    }
    let insert: any = await db.query(
      aql`INSERT ${docA} INTO ${collection} RETURN NEW`,
    )
    expect(insert._result[0].title).to.equal('doc A')

    const docB = {
      title: 'doc B',
      text_en: 'sample word string to search across Alice Bob',
      text_es: 'cadena de palabras de muestra para buscar Alice Bob',
    }
    insert = await db.query(aql`INSERT ${docB} INTO ${collection} RETURN NEW`)
    expect(insert._result[0].title).to.equal('doc B')

    const wait = (t: number) => new Promise((keep) => setTimeout(keep, t))
    await wait(1600)

    const getAllInViewQuery = aql`
    FOR doc in ${aql.literal(info.name)}
      RETURN doc`
    let allResults = await db.query(getAllInViewQuery)
    expect(allResults.hasNext()).to.be.ok
    let all = await allResults.all()
    expect(all[0]).to.have.property('title')
    expect(all[0].title).to.contain('doc')
  })

  after(async () => {
    try {
      db.useDatabase('_system')
      await db.dropDatabase(dbName)
      /* should get deleted when dropping db */
      /* await view.drop() */
    } finally {
      db.close()
    }
  })

  describe('empty terms', () => {
    it(`should bring back all results 
       when empty string/array is passed`, async () => {
      const info = await view.get()
      expect(info.name).to.be.a('string')

      let query = {
        view: info.name,
        collections: [
          {
            name: collectionName,
            analyzer: 'text_en',
          },
        ],
        terms: '',
        key: ['text_en'],
      }
      let aqlQuery = buildAQL(query)
      /* expect(aqlQuery.query).to.equal('') */
      let cursor = await db.query(aqlQuery)
      let has = cursor.hasNext()
      expect(has).to.be.ok

      let result = await cursor.all()
      expect(result).to.have.length(2)

      // pass multiple keys
      query.key = ['text_en', 'text_es']
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      has = cursor.hasNext()
      expect(has).to.be.ok

      result = await cursor.all()
      expect(result).to.have.length(2)
    })
  })

  describe('ANDS', async () => {
    it(`should bring back only results matching AND'ed values
       when +'ed PHRASE's are passed`, async () => {
      const info = await view.get()
      expect(info.name).to.be.a('string')
      let query = {
        view: info.name,
        collections: [
          {
            name: collectionName,
            analyzer: 'text_en',
            keys: ['text_en'],
          },
          {
            name: collectionName,
            analyzer: 'text_es',
            keys: ['text_es'],
          },
        ],
        /* should match both results */
        terms: '+"word"',
        key: [],
      }

      let aqlQuery = buildAQL(query)
      /* expect(aqlQuery.query).to.equal('') */
      /* should match 2 documents */
      let cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      let result = await cursor.next()
      expect(cursor.hasNext()).to.be.ok
      await cursor.next()
      expect(cursor.hasNext()).to.not.be.ok

      /* spanish */
      query.terms = '+"palabras"'
      aqlQuery = buildAQL(query)

      /* should match 2 documents */
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.next()
      expect(cursor.hasNext()).to.be.ok
      await cursor.next()
      expect(cursor.hasNext()).to.not.be.ok

      /* english */
      query.key = ['text_en', 'text_es']
      query.terms = '+"in document"'
      aqlQuery = buildAQL(query)
      expect(aqlQuery.bindVars.value0).to.equal('text_en')
      expect(aqlQuery.bindVars.value1).to.equal('in document')
      expect(aqlQuery.bindVars.value2).to.equal('text_es')
      expect(aqlQuery.bindVars.value3).to.deep.equal({
        collections: query.collections.map((c) => c.name),
      })
      expect(aqlQuery.query).to.equal(`
    FOR doc IN ${view.name}
      
  SEARCH 
    (PHRASE(doc.@value0, @value1, @value0) OR PHRASE(doc.@value2, @value1, @value2)) 
    
    
    
    OPTIONS @value3
      SORT TFIDF(doc) DESC
      
      LIMIT @value4, @value5
    RETURN doc`)

      /* should match 1 document */
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc A')

      /* should match 1 document */
      query.terms = '+"across  "  '
      query.key = ['text_en', 'text_es']
      cursor = await db.query(buildAQL(query))
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc B')
      expect(cursor.hasNext()).to.not.be.ok

      /* should match 0 documents */
      query.terms = '+"wyuxaouw"'
      cursor = await db.query(buildAQL(query))
      expect(cursor.hasNext()).to.not.be.ok

      /* should match 0 documents */
      query.terms = '+"nowhere found"'
      cursor = await db.query(buildAQL(query))
      expect(cursor.hasNext()).to.not.be.ok

      /* multikey */
      query.key = ['text', 'text_es']
      query.terms = '+"buscar"'
      let q = buildAQL(query)
      expect(q.query).to.equal(`
    FOR doc IN ${query.view}
      
  SEARCH 
    (PHRASE(doc.@value0, @value1, @value0) OR PHRASE(doc.@value2, @value1, @value2)) 
    
    
    
    OPTIONS @value3
      SORT TFIDF(doc) DESC
      
      LIMIT @value4, @value5
    RETURN doc`)
      cursor = await db.query(q)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc B')
    })

    it(`should bring back only results matching AND'ed values
       when +'ed TOKEN's are passed`, async () => {
      const info = await view.get()
      expect(info.name).to.be.a('string')
      let query = {
        view: info.name,
        collections: [
          {
            name: collectionName,
            analyzer: 'text_en',
            keys: ['text_en'],
          },
          {
            name: collectionName,
            analyzer: 'text_es',
            keys: ['text_es'],
          },
        ],
        /* should match both results */
        terms: '+word',
        key: ['text_en'],
      }

      /* should bring back 2 document with default empty query string */
      let aqlQuery = buildAQL(query)
      let cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      let result = await cursor.all()
      expect(result).to.have.length(2)

      /* should bring back 1 document */
      /* multikey */
      query.terms = 'not in only in is in'
      query.key = ['text_en', 'text_es']
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc A')

      query.terms = 'not in only in is in'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc A')

      /* should bring back 1 document, partially testing text_en analyzer */
      query.terms = 'samples of things'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc B')

      /* should bring back 1 document, partially testing text_es analyzer */
      query.terms = 'cadena english writing'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc B')

      /* should bring back 0 document */
      query.terms = 'random nonexistent stuff'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.not.be.ok
      result = await cursor.all()
      expect(result).to.have.length(0)

      /* should bring back 0 document */
      query.terms = '49r8fujaaw'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.not.be.ok
      result = await cursor.all()
      expect(result).to.have.length(0)
    })
  })

  describe('ORS', () => {
    it(`should bring back *only* results matching OR'ed values
       when ?'ed PHRASE's are passed
       and when no other boolean operators are present`, async () => {
      const query = {
        view: view.name,
        collections: [
          {
            name: collectionName,
            analyzer: 'text_en',
          },
          {
            name: collectionName,
            analyzer: 'text_es',
          },
        ],
        // should bring back both results
        terms: '?"word"',
        key: ['text_en', 'text_es'],
      }

      /* should bring back 2 results */
      let aqlQuery = buildAQL(query)
      let cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      let result = await cursor.all()
      expect(result).to.have.length(2)

      /* should bring back 1 result */
      query.terms = '"string to search"'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc B')

      /* should bring back 1 result es */
      query.terms = '"muestra para buscar"'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc B')

      /* should bring back 1 result, partially tests case-normalization */
      query.terms = 'collection    items Sample'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc B')

      /* should bring back 0 result */
      query.terms = '  not even  1 match'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.not.be.ok
    })
  })

  describe('NOTS', () => {
    it(`should bring back results *not* matching NOT'ed values
       when -'ed PHRASE's are passed`, async () => {
      const query = {
        view: view.name,
        collections: [
          {
            name: collectionName,
            analyzer: 'text_en',
            keys: ['text_en'],
          },
          {
            name: collectionName,
            analyzer: 'text_es',
            keys: ['text_es'],
          },
        ],
        /*  should bring back 1 result */
        terms: '  -"sample  " word  ',
        key: ['text_en', , 'text_es'],
      }

      /* should bring back 1 results */
      let aqlQuery = buildAQL(query)
      let cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      let result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc A')

      /* should bring back 1 result */
      query.terms = '-"cadena"'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[0].title).to.equal('doc A')

      /* should bring back 0 results */
      query.terms = '-"sample" nothing'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.not.be.ok
    })

    it(`should bring back results *not* matching NOT'ed values
       when -'ed TOKEN's are passed`, async () => {
      const query = {
        view: view.name,
        collections: [
          {
            name: collectionName,
            analyzer: 'text_en',
          },
          {
            name: collectionName,
            analyzer: 'text_es',
          },
        ],
        /*  should bring back 1 result */
        terms: '  -string  ',
        key: ['text_en', 'text_es'],
      }

      /* should bring back 1 results */
      let aqlQuery = buildAQL(query)
      let cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      let result = await cursor.all()
      expect(result).to.have.length(1)
      /* should exclude doc B */
      expect(result[0].title).to.equal('doc A')

      /* should bring back 1 results */
      query.terms = '-documento, palabras'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      /* should exclude doc A */
      expect(result[0].title).to.equal('doc B')

      /* should bring back 0 results */
      query.terms = '-documents    word'
      aqlQuery = buildAQL(query)
      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      /* should exclude doc A */
      expect(result[0].title).to.equal('doc B')
    })
  })
})
