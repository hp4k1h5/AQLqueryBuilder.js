import { expect } from 'chai'
import { Database, DocumentCollection, aql } from 'arangojs'

import { buildAQL } from '../src/index'

const ARANGO_URL = process.env.TEST_ARANGODB_URL || "http://localhost:8529"

describe("boolean search logic", () => {
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
    links[ collectionName ] = {
      fields: { text: { analyzers: [ 'text_en' ] } }
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
    const docA = { title: 'doc A', text: 'words in text in document' }
    const docB = { title: 'doc B', text: 'sample word string to search across' }
    let insert: any = await db.query(aql`INSERT ${docA} INTO ${collection} RETURN NEW`)
    expect(insert._result[ 0 ].title).to.equal('doc A')

    insert = await db.query(aql`INSERT ${docB} INTO ${collection} RETURN NEW`)
    expect(insert._result[ 0 ].title).to.equal('doc B')

    const wait = (t: number) => new Promise(keep => setTimeout(keep, t))
    await wait(1400)

    const getAllInViewQuery = aql`
    FOR doc in ${aql.literal(info.name)}
      RETURN doc 
    `
    let allResults = await db.query(getAllInViewQuery)
    expect(allResults.hasNext()).to.be.ok
    let all = await allResults.all()
    expect(all[ 0 ]).to.have.property('title')
    expect(all[ 0 ].title).to.contain('doc')
  })

  after(async () => {
    try {
      db.useDatabase("_system")
      await db.dropDatabase(dbName)
      /* should get deleted when dropping db */
      /* await view.drop() */
    } finally {
      db.close()
    }
  })

  describe('empty terms', () => {
    it(`should exclude all results that do not match required terms`, async () => {

      const info = await view.get()
      expect(info.name).to.be.a('string')

      let query = {
        view: info.name,
        collections: [ {
          name: collectionName,
          analyzer: 'text_en'
        } ],
        terms: ''
      }
      const aqlQuery = buildAQL(query)
      const cursor = await db.query(aqlQuery)
      let has = cursor.hasNext()
      expect(has).to.be.ok

      let result = await cursor.next()
      expect(result.title).to.match(/doc/)
    })
  })

  describe('ANDS', () => {
    it(`only bring back results that include required words and phrases`, async () => {

      const info = await view.get()
      expect(info.name).to.be.a('string')


      /* phrase */
      let query = {
        view: info.name,
        collections: [ {
          name: collectionName,
          analyzer: 'text_en'
        } ],
        terms: '+"word"'
      }
      let aqlQuery = buildAQL(query)

      expect(Object.keys(aqlQuery.bindVars)).to.have.length(4)

      let cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok
      /* should have two results*/
      let result = await cursor.next()
      expect(cursor.hasNext()).to.be.ok
      await cursor.next()
      expect(cursor.hasNext()).to.not.be.ok

      /* should only have one document */
      query.terms = '+"in document"'
      cursor = await db.query(buildAQL(query))
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[ 0 ].title).to.equal('doc A')

      query.terms = '+"across"'
      cursor = await db.query(buildAQL(query))
      expect(cursor.hasNext()).to.be.ok
      result = await cursor.all()
      expect(result).to.have.length(1)
      expect(result[ 0 ].title).to.equal('doc A')
      expect(cursor.hasNext()).to.not.be.ok


      query.terms = '+"nowhere found"'
      cursor = await db.query(buildAQL(query))
      expect(cursor.hasNext()).to.be.ok

      /* tokens */
      query = {
        view: info.name,
        collections: [ {
          name: collectionName,
          analyzer: 'text_en'
        } ],
        terms: '+word'
      }
      aqlQuery = buildAQL(query)

      expect(Object.keys(aqlQuery.bindVars)).to.have.length(7)
      expect(aqlQuery.bindVars.value0).to.equal('word')
      expect(aqlQuery.bindVars.value1).to.equal('text_en')
      expect(aqlQuery.bindVars.value2).to.equal('text')
      expect(aqlQuery.bindVars.value3).to.equal(1)
      expect(aqlQuery.bindVars.value4).to.deep.equal({ collections: [ collectionName ] })
      expect(aqlQuery.bindVars.value5).to.equal(0)
      expect(aqlQuery.bindVars.value6).to.equal(20)

      cursor = await db.query(aqlQuery)
      expect(cursor.hasNext()).to.be.ok

      result = await cursor.next()
      expect(result.title).to.deep.equal('doc A')
      expect(cursor.hasNext()).to.be.ok
    })
  })

  describe('ORS', () => {
    it(`should exclude all results that do not match required terms`, async () => {
      const query = {
        view: view.name,
        collections: [ {
          name: collectionName,
          analyzer: 'text_en'
        } ],
        terms: '+mandatory -exclude ?"optional phrase"'
      }
      const aqlQuery = buildAQL(query)
      const cursor = await db.query(aqlQuery)

      let has = cursor.hasNext()
      expect(has).to.be.ok

      let result = await cursor.next()
      expect(result).to.deep.equal({ a: 1 })
    })
  })
})
