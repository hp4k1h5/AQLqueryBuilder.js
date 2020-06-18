import {expect} from 'chai'

import {buildAQL} from '../src/index'

describe('index.ts', () => {
  it('should export a function named buildAQL', () => {
    expect(buildAQL).to.exist
    expect(buildAQL).to.be.a('function')
  })

  it('should validate the query', () => {
    expect(() => buildAQL({view: '', collections: [], terms: {}})).to.throw(/query.view must be a valid ArangoSearch View name/)

    expect(() => buildAQL({view: 'view', collections: [], terms: {}})).to.throw(/query.collections must have at least one name/)
  })
})
