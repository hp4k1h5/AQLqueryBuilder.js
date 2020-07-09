import { query } from './lib/structs';
/** @returns an AQL query object. See @param query for details on required
 * values. @parm query .terms accepts either a string to be parsed or an array
 * of @param term
 * */
export declare function buildAQL(query: query, limit?: any): any;
