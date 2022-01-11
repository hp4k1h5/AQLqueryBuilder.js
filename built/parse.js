"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.ParseError = exports.parseQueryEXP = exports.parseQuery = void 0;
var structs_1 = require("./lib/structs");
function parseQuery(queryString) {
    var queryRgx = /[+?-]?(["'(]).+?(\1|\))|[^"'()\s]+/g;
    var matches = queryString.match(queryRgx);
    if (!matches)
        return [];
    return matches.map(function (match) {
        /* strip op */
        var op = structs_1.Operator.OR;
        if (/[+?-]/.test(match[0])) {
            op = structs_1.Operator[match[0]];
            match = match.substring(1);
        }
        if (match[0] == '"' || match[0] == "'") {
            return {
                type: structs_1.Type.phrase,
                val: match,
                op: op
            };
        }
        else {
            return {
                type: structs_1.Type.token,
                val: match,
                op: op
            };
        }
    });
}
exports.parseQuery = parseQuery;
function parseQueryEXP(queryString) {
    return lex(queryString);
}
exports.parseQueryEXP = parseQueryEXP;
function lex(queryString) {
    var lexes = [];
    var curToken = '';
    var curTokenType = structs_1.Type.token;
    var curOperator = structs_1.Operator.OR;
    var isToken = false;
    for (var i = 0; i < queryString.length; i++) {
        var ch = new structs_1.Char(queryString[i]);
        if (ch.isSpace()) {
            if (curToken.length) {
                if (curTokenType === structs_1.Type.token) {
                    isToken = true;
                }
                else {
                    curToken += ch.char;
                }
            }
        }
        else if (ch.isOperator()) {
            if (curToken.length) {
                throw new ParseError(ch.char, i, "Logical operator must precede query term.");
            }
            curOperator = structs_1.Operator[ch.char];
        }
        else if (ch.isQuote()) {
            if (curToken.length && curTokenType === structs_1.Type.phrase) {
                isToken = true;
            }
            else {
                curTokenType = structs_1.Type.phrase;
            }
        }
        else {
            curToken += ch.char;
        }
        if (isToken) {
            resetCur();
        }
    }
    if (curToken.length) {
        resetCur();
    }
    function resetCur() {
        lexes.push({
            type: curTokenType,
            val: curToken,
            op: curOperator
        });
        curToken = '';
        curTokenType = structs_1.Type.token;
        curOperator = structs_1.Operator.OR;
        isToken = false;
    }
    return lexes;
}
var ParseError = /** @class */ (function (_super) {
    __extends(ParseError, _super);
    function ParseError(char, pos, message) {
        var _this = _super.call(this, message) || this;
        _this.char = char;
        _this.pos = pos;
        return _this;
    }
    ParseError.prototype.print = function () {
        return "err:  \u201C ".concat(this.char, " \u201D in position ").concat(this.pos, " ").concat(this.message);
    };
    return ParseError;
}(Error));
exports.ParseError = ParseError;
