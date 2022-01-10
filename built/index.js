"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports.buildAQL = exports.parseQuery = exports.buildFilters = void 0;
var arangojs_1 = require("arangojs");
var search_1 = require("./search");
var filter_1 = require("./filter");
var filter_2 = require("./filter");
__createBinding(exports, filter_2, "buildFilters");
var parse_1 = require("./parse");
__createBinding(exports, parse_1, "parseQuery");
/** @returns an AQL query object. See @param query for details on required
 * values. @param query.terms accepts either a string to be parsed or an array
 * of terms.
 *
 * ! NOTE: v0.1.1 introduced a breaking change to adhere to the ArangoSearch
 * spec. Please refer to
 * <https://www.arangodb.com/docs/stable/aql/operations-limit.html> @param
 * limit is an object with keys `start` @default 0, and `count` @default 20 */
function buildAQL(query, limit) {
    if (limit === void 0) { limit = { start: 0, count: 20 }; }
    validateQuery(query);
    collectKeys(query);
    var SEARCH = (0, search_1.buildSearch)(query);
    var FILTER = query.filters && (0, filter_1.buildFilters)(query.filters);
    /* FOR doc IN ${query.view} */
    return (0, arangojs_1.aql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    FOR doc IN ", "\n      ", "\n      ", "\n      LIMIT ", ", ", "\n    RETURN doc"], ["\n    FOR doc IN ", "\n      ", "\n      ", "\n      LIMIT ", ", ", "\n    RETURN doc"])), arangojs_1.aql.literal(query.view), SEARCH, FILTER, limit.start, limit.count);
}
exports.buildAQL = buildAQL;
function validateQuery(query) {
    if (!query.view.length)
        throw new Error('query.view must be a valid ArangoSearch View name');
    if (!query.collections.length)
        throw new Error('query.collections must have at least one name');
}
function collectKeys(query) {
    /* unify query.key */
    var _keys;
    if (typeof query.key == 'string') {
        _keys = [query.key];
    }
    else if (!query.key) {
        _keys = ['text'];
    }
    else
        _keys = query.key;
    query.collections = query.collections.map(function (c) {
        if (!c.keys)
            c.keys = _keys;
        return c;
    });
}
var templateObject_1;
