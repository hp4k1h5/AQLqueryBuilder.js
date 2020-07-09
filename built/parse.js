"use strict";
exports.__esModule = true;
exports.parseQuery = void 0;
function parseQuery(queryString) {
    var queryRgx = /[+?-]?(["'(]).+?(\1|\))|[^"'()\s]+/g;
    var matches = queryString.match(queryRgx);
    if (!matches)
        return [];
    return matches.map(function (match) {
        /* strip op */
        var op = '?';
        if (/[+?-]/.test(match[0])) {
            op = match[0];
            match = match.substring(1);
        }
        if (match[0] == '"' || match[0] == "'") {
            return {
                type: 'phr',
                val: match,
                op: op
            };
        }
        else {
            return {
                type: 'tok',
                val: match,
                op: op
            };
        }
    });
}
exports.parseQuery = parseQuery;
