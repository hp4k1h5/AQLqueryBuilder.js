"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
exports.__esModule = true;
exports.buildAQL = void 0;
var arangojs_1 = require("arangojs");
var search_1 = require("./search");
var filter_1 = require("./filter");
/** @returns an AQL query object. See @param query for details on required
 * values. @parm query .terms accepts either a string to be parsed or an array
 * of @param term
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
