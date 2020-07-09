"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
exports.__esModule = true;
exports.buildSearch = void 0;
var arangojs_1 = require("arangojs");
var parse_1 = require("./parse");
function buildSearch(query) {
    /* parse string query */
    query.terms =
        typeof query.terms == 'string' ? parse_1.parseQuery(query.terms) : query.terms;
    /* build boolean pieces */
    var ANDS = buildOPS(query.collections, query.terms, '+', query.key);
    var ORS = buildOPS(query.collections, query.terms, '?', query.key);
    var NOTS = buildOPS(query.collections, query.terms, '-', query.key);
    /* handle combinations */
    if (ANDS && ORS) {
        ANDS = arangojs_1.aql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " OR (", " AND ", ")"], ["", " OR (", " AND ", ")"])), ANDS, ANDS, ORS);
        ORS = undefined;
    }
    if (!!NOTS) {
        NOTS = arangojs_1.aql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " \n    ", " ", "\n    ", " ", ""], ["", " \n    ", " ", "\n    ", " ",
            ""])), ANDS || ORS ? arangojs_1.aql.literal(' AND ') : undefined, NOTS.phrases ? arangojs_1.aql.literal(' NOT ') : undefined, NOTS.phrases, NOTS.phrases && NOTS.tokens ? arangojs_1.aql.literal(' AND ') : undefined, NOTS.tokens);
    }
    /* if an empty query.terms string or array is passed, SEARCH true, bringing
     * back all documents in view */
    return arangojs_1.aql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n  SEARCH \n    ", " \n    ", "\n    ", "\n    ", "\n    OPTIONS ", "\n      SORT TFIDF(doc) DESC"], ["\n  SEARCH \n    ", " \n    ", "\n    ", "\n    ", "\n    OPTIONS ", "\n      SORT TFIDF(doc) DESC"])), ANDS, ORS, NOTS, (!ANDS && !ORS && !NOTS) || undefined, { collections: query.collections.map(function (c) { return c.name; }) });
}
exports.buildSearch = buildSearch;
function buildOPS(collections, terms, op, key) {
    if (key === void 0) { key = 'text'; }
    var opWord = op == '+' ? ' AND ' : ' OR ';
    var queryTerms = terms.filter(function (t) { return t.op == op; });
    if (!queryTerms.length)
        return;
    /* phrases */
    var phrases = queryTerms.filter(function (qT) { return qT.type == 'phr'; });
    phrases = buildPhrases(phrases, collections, key, opWord);
    /* tokens */
    var tokens = queryTerms.filter(function (qT) { return qT.type === 'tok'; });
    tokens = tokens && buildTokens(tokens, collections, key);
    if (!phrases && !tokens)
        return;
    if (op == '-')
        return { phrases: phrases, tokens: tokens };
    if (phrases && tokens)
        return arangojs_1.aql.join([phrases, tokens], opWord);
    return tokens || phrases;
}
function buildPhrases(phrases, collections, key, opWord) {
    if (!phrases.length)
        return undefined;
    return arangojs_1.aql.join(phrases.map(function (phrase) { return buildPhrase(phrase, collections, key); }), opWord);
}
function buildPhrase(phrase, collections, key) {
    var phrases = collections.map(function (coll) {
        return arangojs_1.aql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["PHRASE(doc.", ", ", ", ", ")"], ["PHRASE(doc.", ", ", ", ", ")"])), key, phrase.val.slice(1, -1), coll.analyzer);
    });
    return arangojs_1.aql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["(", ")"], ["(", ")"])), arangojs_1.aql.join(phrases, ' OR '));
}
function buildTokens(tokens, collections, key) {
    if (!tokens.length)
        return;
    var opWordMap = {
        '+': 'ALL',
        '?': 'ANY',
        '-': 'NONE'
    };
    var mapped = tokens.reduce(function (a, v) {
        var op = a[opWordMap[v.op]];
        a[opWordMap[v.op]] = op ? op + ' ' + v.val : v.val;
        return a;
    }, {});
    var makeTokenAnalyzers = function (tokens, op, analyzer, key) {
        return arangojs_1.aql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n      ANALYZER(\n        TOKENS(", ", ", ")\n        ", " IN doc.", ", ", ")"], ["\n      ANALYZER(\n        TOKENS(", ", ", ")\n        ", " IN doc.", ", ", ")"])), tokens, analyzer, arangojs_1.aql.literal(op), key, analyzer);
    };
    var remapped = [];
    collections.forEach(function (coll) {
        remapped.push.apply(remapped, Object.keys(mapped).map(function (op) {
            return makeTokenAnalyzers(mapped[op], op, coll.analyzer, key);
        }));
    });
    return arangojs_1.aql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["MIN_MATCH(", ", \n    ", ")"], ["MIN_MATCH(", ", \n    ", ")"])), arangojs_1.aql.join(remapped, ', '), tokens[0].op === '-' ? collections.length : 1);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
