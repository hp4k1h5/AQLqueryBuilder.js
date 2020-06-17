import {expect} from 'chai'

import {buildQuery} from '../src/index'

describe('index.ts', () => {
  it('should export a function named buildQuery', () => {
    expect(buildQuery).to.exist
    expect(buildQuery).to.be.a('function')
  })
})
