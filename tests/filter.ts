import { expect } from 'chai'

import { buildFilters } from '../src/filter'

describe('filter.ts', () => {
  it('should export a function named buildFilters', () => {
    expect(buildFilters).to.be.a('function')
  })

  it(`should return an aql object
     when a single filter is passed`, () => {
    const filters = [ {
      field: 'field',
      op: 'LIKE',
      val: 'val'
    } ]
    const builtFilters = buildFilters(filters)

    expect(builtFilters).to.be.an('object')
    //.that.deep.equals({})
    expect(builtFilters.query).to.equal("FILTER doc.@value0 LIKE @value1")
  })

  it(`should return an aql object
     when a multiple filters are passed`, () => {
    const filters = [ {
      field: 'number field',
      op: '>',
      val: 0
    }, {
      field: 'text field',
      op: 'LIKE',
      val: 'val'
    }, ]
    const builtFilters = buildFilters(filters)

    expect(builtFilters).to.be.an('object')
    expect(builtFilters.query).to.equal("FILTER doc.@value0 > @value1 && doc.@value2 LIKE @value3")
  })
})
