import { JSONRPCClient } from './JSONRPC20';

export interface ServiceClientParams {
    url: string;
    timeout: number;
    token?: string;
}

export abstract class ServiceClient {
    abstract module: string;
    url: string;
    timeout: number;
    token?: string;

    constructor({ url, timeout, token }: ServiceClientParams) {
        this.url = url;
        this.timeout = timeout;
        this.token = token;
    }

    async callFunc<ParamType, ReturnType>(funcName: string, params: ParamType): Promise<ReturnType> {
        const client = new JSONRPCClient({
            url: this.url,
            timeout: this.timeout,
            authorization: this.token
        });
        const method = this.module + '.' + funcName;
        const result = await client.callMethod(method, { params });

        return (result as unknown) as ReturnType;
    }

    async callFuncNoParams<ReturnType>(funcName: string): Promise<ReturnType> {
        const client = new JSONRPCClient({
            url: this.url,
            timeout: this.timeout,
            authorization: this.token
        });
        const method = this.module + '.' + funcName;
        const result = await client.callMethod(method, { timeout: this.timeout });

        return (result as unknown) as ReturnType;
    }

    async callFuncNoResult<ParamType>(funcName: string, params: ParamType): Promise<void> {
        const client = new JSONRPCClient({
            url: this.url,
            timeout: this.timeout,
            authorization: this.token
        });
        const method = this.module + '.' + funcName;
        await client.callMethod(method, { params, timeout: this.timeout });

        // if (result.length !== 0) {
        //     throw new Error(`Too many (${result.length}) return values in return array`);
        // }

        return;
    }
}
