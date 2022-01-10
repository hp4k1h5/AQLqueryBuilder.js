import { query } from './lib/structs';
export { buildFilters } from './filter';
export { parseQuery } from './parse';
/** @returns an AQL query object. See @param query for details on required
 * values. @param query.terms accepts either a string to be parsed or an array
 * of terms.
 *
 * ! NOTE: v0.1.1 introduced a breaking change to adhere to the ArangoSearch
 * spec. Please refer to
 * <https://www.arangodb.com/docs/stable/aql/operations-limit.html> @param
 * limit is an object with keys `start` @default 0, and `count` @default 20 */
export declare function buildAQL(query: query, limit?: any): any;
