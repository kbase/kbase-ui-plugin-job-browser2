import {
    HTTPClient, GeneralError, TimeoutError, AbortError, Response,
    RequestOptions, HTTPHeader
} from './HTTPClient';

import uuid from 'uuid';

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

export class JSONRPCError extends Error {
    code: string;
    message: string;
    detail?: string;
    data?: any;
    constructor(errorInfo: JSONRPCErrorInfo) {
        super(errorInfo.message);
        this.name = 'JSONRPCError';

        this.code = errorInfo.code;
        this.message = errorInfo.message;
        this.detail = errorInfo.detail;
        this.data = errorInfo.data;
        this.stack = (<any>new Error()).stack;
    }
}

export interface JSONRPCClientParams {
    url: string,
    // module: string,
    timeout: number;
    authorization?: string;
}

export interface JSONPayload<T> {
    version: string;
    method: string;
    id: string;
    params: T;
}

export abstract class JSONRPCClient {
    static module: string;
    url: string;
    // module: string;
    timeout: number;
    authorization?: string;
    constructor({ url, timeout, authorization }: JSONRPCClientParams) {
        this.url = url;
        // this.module = module;
        this.timeout = timeout;
        this.authorization = authorization;
    }

    isGeneralError(error: GeneralError) {
        return (error instanceof GeneralError);
    }


    protected makePayload<T>(method: string, param: T): JSONPayload<T> {
        return {
            version: '1.1',
            method: JSONRPCClient.module + '.' + method,
            id: String(Math.random()).slice(2),
            params: param
        };
    }

    async callFunc<P, R>(func: string, param: P, { timeout }: { timeout?: number; } = {}): Promise<R> {
        const params = this.makePayload<P>(func, param);
        const rpc: JSONRPCRequest = {
            version: '1.1',
            method: JSONRPCClient.module + '.' + func,
            id: uuid.v4(),
            params: [params],
        };

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
            data: JSON.stringify(rpc),
            header: header
        };

        const httpClient = new HTTPClient();
        return httpClient.request(requestOptions)
            .then((result) => {
                try {
                    return JSON.parse(result.response);
                } catch (ex) {
                    throw new JSONRPCError({
                        code: 'parse-error',
                        message: ex.message,
                        detail: 'The response from the service could not be parsed',
                        data: {
                            responseText: result.response
                        }
                    });
                }
            })
            .catch((err) => {
                if (err instanceof GeneralError) {
                    throw new JSONRPCError({
                        code: 'connection-error',
                        message: err.message,
                        detail: 'An error was encountered communicating with the service',
                        data: {}
                    });
                } else if (err instanceof TimeoutError) {
                    throw new JSONRPCError({
                        code: 'timeout-error',
                        message: err.message,
                        detail: 'There was a timeout communicating with the service',
                        data: {}
                    });
                } else if (err instanceof AbortError) {
                    throw new JSONRPCError({
                        code: 'abort-error',
                        message: err.message,
                        detail: 'The connection was aborted while communicating with the service',
                        data: {}
                    });
                }
            });
    }
}