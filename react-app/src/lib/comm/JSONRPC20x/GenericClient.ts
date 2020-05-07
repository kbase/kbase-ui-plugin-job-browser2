import axios, { AxiosResponse } from 'axios';
import { JSONValue } from '../../../redux/types/json';

export interface GenericClientParams {
    url: string;
    module: string;
    token?: string;
    timeout?: number;
}

const DEFAULT_TIMEOUT = 10000;

export interface JSONRPCPayload<T> {
    jsonrpc: string;
    method: string;
    id: string;
    params: T;
}

export interface JSONRPCError {
    code: number;
    message: string;
    data?: JSONValue;
}

// export interface MethodSuccessResult<T> {
//     result: T;
//     error: null;
// }

// export interface MethodErrorResult {
//     result: null;
//     error: JSONRPCError;
// }

// export type MethodResponse<T> = MethodSuccessResult<T> | MethodErrorResult;

// export type JSONRPCResponse<T> =
//     // success
//     | [T, null, null]
//     // success, but void result
//     | [null, null, null]
//     // error returned by method, not sdk wrapper
//     | [null, MethodErrorResult, null]
//     // error returned by sdk wrapper (caught exception)
//     | [null, null, JSONRPCError];

export class JSONRPCException extends Error {
    code: number;
    data?: JSONValue;
    constructor({ code, message, data }: JSONRPCError) {
        super(message);
        this.code = code;
        this.data = data;
    }
}

export interface JSONRPCResultBase {
    jsonrpc: '2.0',
    id: string;
}

export interface JSONRPCSuccessResult<T> extends JSONRPCResultBase {
    result: T;
}

export interface JSONRPCErrorResult extends JSONRPCResultBase {
    error: JSONRPCError;
}

export type JSONRPCResult<T, E> = JSONRPCSuccessResult<T> | JSONRPCErrorResult;

export class GenericClient {
    url: string;
    token?: string;
    module: string;
    timeout?: number;

    constructor({ url, token, module, timeout }: GenericClientParams) {
        this.url = url;
        this.token = token;
        this.module = module;
        this.timeout = timeout || DEFAULT_TIMEOUT;
    }

    protected makePayload<T>(method: string, param: T): JSONRPCPayload<T> {
        return {
            jsonrpc: '2.0',
            method: this.module + '.' + method,
            id: String(Math.random()).slice(2),
            params: param
        };
    }

    protected processResponse<T>(response: AxiosResponse<string>): T {
        // if no response, error
        const responseText = response.data;

        if (responseText.length === 0) {
            throw new Error('Empty response');
        }

        // try to parse as json
        let responseData: JSONRPCResult<T, any>;
        try {
            responseData = ((JSON.parse(responseText) as unknown) as JSONRPCResult<T, any>);
        } catch (ex) {
            console.error('Error parsing json', responseText, ex.message);
            throw new Error('Error parsing response as JSON: ' + ex.message);
        }

        if ('error' in responseData) {
            // Were all good
            console.warn('about to throw error', responseData.error);
            throw new JSONRPCException(responseData.error);
        }
        return responseData.result;
    }

    async callFunc<P, R>(func: string, param: P): Promise<R> {
        const headers: any = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = this.token;
        }
        const params = this.makePayload<P>(func, param);
        const response = await axios.post(this.url, params, {
            headers,
            timeout: this.timeout,
            responseType: 'text'
        });
        return this.processResponse<R>(response);
    }
}
