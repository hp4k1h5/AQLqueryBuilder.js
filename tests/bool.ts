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
        links[collectionName] = {
            fields: { text: { analyzers: ['text_en'] } }
        }
        await view.create({ links })
        let info = await view.get()
        expect(info.name).to.equal(view.name)

        /* add documents */
        const doc1 = { title: 'doc A', text: 'words in text in document' }
        const doc2 = { title: 'doc A', text: 'sample word string to search across' }
        await db.query(aql`INSERT ${doc1} INTO ${collection}`)
        await db.query(aql`INSERT ${doc2} INTO ${collection}`)
    })
    after(async () => {
        try {
            db.useDatabase("_system")
            await db.dropDatabase(dbName)
            await view.drop()
        } finally {
            db.close()
        }
    })

    describe('ANDS', () => {
        it(`should exclude all results that do not match required terms`, async () => {
            const query = {
                view: view.name,
                collections: [{
                    name: collectionName,
                    analyzer: 'text_en'
                }],
                terms: '+word'
            }
            const aqlQuery = buildAQL(query)

            expect(Object.keys(aqlQuery.bindVars)).to.have.length(7)
            expect(aqlQuery.bindVars.value0).to.equal('word')
            expect(aqlQuery.bindVars.value1).to.equal('text_en')
            expect(aqlQuery.bindVars.value2).to.equal('text')
            expect(aqlQuery.bindVars.value3).to.equal(1)
            expect(aqlQuery.bindVars.value4).to.deep.equal({ collections: [collectionName] })
            expect(aqlQuery.bindVars.value5).to.equal(0)
            expect(aqlQuery.bindVars.value6).to.equal(20)
            expect(aqlQuery.query).to.equal(`
    FOR doc IN ${view.name}

  SEARCH
    MIN_MATCH(
      ANALYZER(
        TOKENS(@value0, @value1)
        ALL IN doc.@value2, @value1),
    @value3)



    OPTIONS @value4
      SORT TFIDF(doc) DESC

      LIMIT @value5, @value6
    RETURN doc`)

            const cursor = await db.query(aqlQuery)
            let has = cursor.hasNext()
            expect(has).to.be.ok

            let result = await cursor.next()
            expect(result).to.deep.equal({ a: 1 })
        })
    })
    describe('ORS', () => {
        it(`should exclude all results that do not match required terms`, async () => {
            const query = {
                view: view.name,
                collections: [{
                    name: collectionName,
                    analyzer: 'text_en'
                }],
                terms: '+mandatory -exclude ?"optional phrase"'
            }
            const aqlQuery = buildAQL(query)
            expect(aqlQuery.query).to.equal('')

        })
    })

})
