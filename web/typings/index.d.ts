declare module 'hot-formula-parser' {
    type hook<T> = {};
    type hookParameters = any[];
    type hookDoneCallback = (result: any) => void;
    type callVariableHook = ((name: string, done: hookDoneCallback) => void) & hook<'callVariable'>;
    type callFunctionHook = ((name: string, params: any[], done: hookDoneCallback) => void) & hook<'callFunction'>;
    // TODO: Add callCellValue/callRangeValue hooks.
    export interface ParserResponse {
        result: string | null;
        error: '#ERROR!' | '#DIV/0!' | '#NAME?' | '#N/A' | '#NUM!' | '#VALUE!' | null;
    }
    export class Parser {
        constructor();

        parse(expression?: string): ParserResponse;
        setVariable(name: string, value: any): void;
        getVariable(name: string): string;
        setFunction(name: string, fn: (params: hookParameters) => any): void;
        getFunction(name: string): (params: hookParameters) => any;

        on<T>(hook: T, fn: hook<T>): void;
    }
    export const SUPPORTED_FORMULAS: string[];
}
