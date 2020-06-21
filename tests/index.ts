import { expect } from 'chai'

import { buildAQL } from '../src/index'

describe('index.ts', () => {
  it('should export a function named buildAQL', () => {
    expect(buildAQL).to.exist
    expect(buildAQL).to.be.a('function')
  })

  it('should validate the query', () => {
    expect(() => buildAQL({ view: '', collections: [], terms: [] })).to.throw(/query.view must be a valid ArangoSearch View name/)

    expect(() => buildAQL({ view: 'view', collections: [], terms: [] })).to.throw(/query.collections must have at least one name/)
  })

  it(`should be importable by a .ts compatible module 
     without compilation `, () => {
    /* TODO  run a tsc process to demonstrate importing this library as is */
    /* manual test: ✅ works (2020/06/21) */
  })

  it(`should compile to an npm installable module`, () => {

    /* TODO run a node process to npm i --save the parent module */
    /* manual test: ✅ works (2020/06/21) */
  })

  it(`should compile to a .js compatible module`, () => {
    /* TODO run a node subprocess and call a .js file that uses rquire() */
    /* manual test: ✅ works (2020/06/21) */
  })
})
