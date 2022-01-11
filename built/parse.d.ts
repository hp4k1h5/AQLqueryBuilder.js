import { Term } from './lib/structs';
export declare function parseQuery(queryString: string): Term[];
export declare function parseQueryEXP(queryString: string): Term[];
export declare class ParseError extends Error {
    char: string;
    pos: number;
    constructor(char: string, pos: number, message: string);
    print(): string;
}
