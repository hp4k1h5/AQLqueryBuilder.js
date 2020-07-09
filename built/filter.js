"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
exports.__esModule = true;
exports.buildFilters = void 0;
var arangojs_1 = require("arangojs");
function buildFilters(filters) {
    if (!filters.length)
        return;
    var _filters = filters.map(function (f) { return arangojs_1.aql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["doc.", " ", " ", ""], ["doc.", " ", " ", ""])), f.field, arangojs_1.aql.literal(f.op), f.val); });
    return arangojs_1.aql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["FILTER ", ""], ["FILTER ", ""])), arangojs_1.aql.join(_filters, ' && '));
}
exports.buildFilters = buildFilters;
var templateObject_1, templateObject_2;
