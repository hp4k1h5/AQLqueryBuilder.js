import { expect } from 'chai'

import { buildQuery } from '../src/index'

describe('index.ts', () => {
    it('should export a function named buildQuery', () => {
        expect(buildQuery).to.exist
        expect(buildQuery).to.be.a('function')
    })

    it('should validate the query', () => {
        expect(() => buildQuery({ view: '', collections: [], terms: {} })).to.throw(/query.view must be a valid ArangoSearch View name/)

        expect(() => buildQuery({ view: 'view', collections: [], terms: {} })).to.throw(/query.collections must have at least one name/)
    })
})
