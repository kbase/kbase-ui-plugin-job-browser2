import HTTPClient, {
    GeneralError, RequestOptions, HTTPHeader
} from '../http/HTTPClient';

import { v4 as uuid } from 'uuid';
import { JSONValue, JSONObject, JSONArray } from '../../../redux/types/json';


export interface JSONRPCRequestOptions {
    func: string,
    params: any,
    timeout?: number,
    authorization?: string;
}

// The JSON RPC Request parameters
// An array of  JSON objects
export interface JSONRPCParam {
    [key: string]: any;
}

// The entire JSON RPC request object
export interface JSONRPCRequest {
    method: string,
    version: '1.1',
    id: string,
    params: Array<JSONRPCParam>,
    context?: any;
}

export interface JSONRPCErrorInfo {
    code: string,
    status?: number,
    message: string,
    detail?: string;
    data?: any;
}

// export class JSONRPCError extends Error {
//     code: string;
//     message: string;
//     detail?: string;
//     data?: any;
//     constructor(errorInfo: JSONRPCErrorInfo) {
//         super(errorInfo.message);
//         this.name = 'JSONRPCError';

//         this.code = errorInfo.code;
//         this.message = errorInfo.message;
//         this.detail = errorInfo.detail;
//         this.data = errorInfo.data;
//         this.stack = (<any>new Error()).stack;
//     }
// }

export interface JSONRPCClientParams {
    url: string,
    timeout: number;
    authorization?: string;
}

export interface JSONPayload {
    jsonrpc: string;
    method: string;
    id: string;
    params?: JSONObject | JSONArray;
}

export interface JSONRPC20Error {
    code: number;
    message: string;
    data: JSONValue;
}

export type JSONRPCError = JSONRPC20Error;

export class JSONRPC20Exception extends Error {
    error: JSONRPC20Error;
    constructor(error: JSONRPCError) {
        super(error.message);
        this.error = error;
    }
}

export interface JSONRPCResponseResult {
    result: Array<JSONValue>;
    error: null;
}

export interface JSONRPCResponseError {
    result: null;
    error: JSONRPCError;
}

export type JSONRPCResponse = JSONRPCResponseResult | JSONRPCResponseError;

export interface CallMethodOptions {
    params?: JSONRPCParam;
    timeout?: number;
}

export class JSONRPCClient {
    url: string;
    timeout: number;
    authorization?: string;
    constructor({ url, timeout, authorization }: JSONRPCClientParams) {
        this.url = url;
        this.timeout = timeout;
        this.authorization = authorization;
    }

    isGeneralError(error: GeneralError) {
        return (error instanceof GeneralError);
    }

    protected makePayload(method: string, params?: JSONRPCParam): JSONPayload {
        return {
            jsonrpc: '2.0',
            method,
            params,
            id: uuid()
        };
    }

    async callMethod(method: string, { params, timeout }: CallMethodOptions = {}): Promise<JSONValue> {
        const payload = this.makePayload(method, params);
        const header: HTTPHeader = new HTTPHeader();
        header.setHeader('content-type', 'application/json');
        header.setHeader('accept', 'application/json');
        if (this.authorization) {
            header.setHeader('authorization', this.authorization);
        }

        const requestOptions: RequestOptions = {
            method: 'POST',
            url: this.url,
            timeout: timeout || this.timeout,
            data: JSON.stringify(payload),
            header: header
        };

        const httpClient = new HTTPClient();
        return httpClient.request(requestOptions)
            .then((httpResponse) => {
                let result: JSONRPCResponse;
                try {
                    result = (JSON.parse(httpResponse.response) as unknown) as JSONRPCResponse;
                } catch (ex) {
                    throw new JSONRPC20Exception({
                        code: 100,
                        message: 'The response from the service could not be parsed',
                        data: {
                            originalMessage: ex.message,
                            responseText: httpResponse.response
                        }
                    });
                }

                if (result.hasOwnProperty('error')) {
                    const errorResult = (result as unknown) as JSONRPCResponseError;
                    throw new JSONRPC20Exception({
                        code: errorResult.error.code,
                        message: errorResult.error.message,
                        data: errorResult.error.data
                    });
                }

                const rpcResponse = (result as unknown) as JSONRPCResponseResult;
                return rpcResponse.result;
            });
        // .then((response) => {
        //     let result: JSONValue;
        //     try {
        //         result = JSON.parse(response.response);
        //     } catch (ex) {
        //         throw new JSONRPC11Exception({
        //             name: 'parse error',
        //             code: 100,
        //             message: 'The response from the service could not be parsed',
        //             error: {
        //                 originalMessage: ex.message,
        //                 responseText: response.response
        //             }
        //         });
        //     }
        //     if (result.hasOwnProperty('error')) {
        //         const errorResult = (result as unknown) as JSONRPCResponseError;
        //         throw new JSONRPC11Exception({
        //             name: result.name,
        //             code: result.code,

        //         })
        //     }
        //     const rpcResponse = (result as unknown) as JSONRPCResponseResult<T>;
        //     return rpcResponse.result;
        // })
        // .catch((err) => {
        //     if (err instanceof GeneralError) {
        //         throw new JSONRPC11Exception({
        //             name: 'connection-error',
        //             code: 100,
        //             message: 'An error was encountered communicating with the service',
        //             error: {
        //                 originalMessage: err.message
        //             }
        //         });
        //     } else if (err instanceof TimeoutError) {
        //         throw new JSONRPC11Exception({
        //             name: 'timeout-error',
        //             code: 100,
        //             error: {
        //                 originalMessage: err.message
        //             },
        //             message: 'There was a timeout communicating with the service'
        //         });
        //     } else if (err instanceof AbortError) {
        //         throw new JSONRPC11Exception({
        //             name: 'abort-error',
        //             code: 100,
        //             error: {
        //                 originalMessage: err.message
        //             },
        //             message: 'The connection was aborted while communicating with the service'
        //         });
        //     }
        // });
    }
}