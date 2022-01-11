"use strict";
exports.__esModule = true;
exports.Char = exports.Operator = exports.Type = void 0;
var Type;
(function (Type) {
    Type["phrase"] = "phr";
    Type["token"] = "tok";
})(Type = exports.Type || (exports.Type = {}));
var Operator;
(function (Operator) {
    Operator["AND"] = "+";
    Operator["+"] = "+";
    Operator["OR"] = "?";
    Operator["?"] = "?";
    Operator["NOT"] = "-";
    Operator["-"] = "-";
})(Operator = exports.Operator || (exports.Operator = {}));
var Char = /** @class */ (function () {
    function Char(ch) {
        this.char = ch;
    }
    Char.prototype.isSpace = function () {
        return /\s/.test(this.char);
    };
    Char.prototype.isOperator = function () {
        return /[-+?]/.test(this.char);
    };
    Char.prototype.isQuote = function () {
        return /"|'/.test(this.char);
    };
    return Char;
}());
exports.Char = Char;
