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
exports.buildAQL = void 0;
var arangojs_1 = require("arangojs");
var search_1 = require("./search");
var filter_1 = require("./filter");
var filter_2 = require("./filter");
__createBinding(exports, filter_2, "buildFilters");
var parse_1 = require("./parse");
__createBinding(exports, parse_1, "parseQuery");
/** @returns an AQL query object. See @param query for
 * details on required values. @param query.terms accepts
 * either a string to be parsed or an array of terms. @param limit is an object with keys `start` default 0, and `end` default 20.
 * */
function buildAQL(query, limit) {
    if (limit === void 0) { limit = { start: 0, end: 20 }; }
    validateQuery(query);
    var SEARCH = search_1.buildSearch(query);
    var FILTER = query.filters && filter_1.buildFilters(query.filters);
    /* FOR doc IN ${query.view} */
    return arangojs_1.aql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    FOR doc IN ", "\n      ", "\n      ", "\n      LIMIT ", ", ", "\n    RETURN doc"], ["\n    FOR doc IN ", "\n      ", "\n      ", "\n      LIMIT ", ", ", "\n    RETURN doc"])), arangojs_1.aql.literal(query.view), SEARCH, FILTER, limit.start, limit.end);
}
exports.buildAQL = buildAQL;
function validateQuery(query) {
    if (!query.view.length)
        throw new Error('query.view must be a valid ArangoSearch View name');
    if (!query.collections.length)
        throw new Error('query.collections must have at least one name');
}
var templateObject_1;
