import { ServiceClient } from '../ServiceClient';
import { SDKBoolean } from '../JSONRPC11/types';

// interface IsAdminParam {
//     username?: string;
// }

type IsAdminParam = null;

type IsAdminResult = boolean;

interface GetExecAggrTableParam {
    begin?: number;
    end?: number;
}

interface GetExecAggrTableResult {
    app: string;
    func: string;
    func_mod: string;
    n: number;
    user: string;
}

interface GetExecAggrStatsParam {
    full_app_ids?: Array<string>;
    per_week?: boolean;
}

interface GetExecAggrStatsResult {
    full_app_id: string;
    time_range: string;
    type: string;
    number_of_calls: number;
    number_of_errors: number;
    module_name: string;
    total_queue_time: number;
    total_exec_time: number;
}

export interface VersionCommitInfo {
    git_commit_hash: string;
}

export interface BasicModuleInfo {
    module_name: string;
    git_url: string;
    language: string;
    dynamic_service: SDKBoolean;
    owners: Array<string>;
    dev: VersionCommitInfo;
    beta: VersionCommitInfo;
    release: VersionCommitInfo;
    released_version_list: Array<VersionCommitInfo>;
}


export interface ListBasicModuleInfoParams {
    owners?: Array<string>;
    include_released?: SDKBoolean;
    include_unreleased?: SDKBoolean;
    include_disabled?: SDKBoolean;
    include_modules_with_no_name_set?: SDKBoolean;
}

export type ListBasicModuleInfoResult = Array<BasicModuleInfo>;

export default class CatalogClient extends ServiceClient {
    module: string = 'Catalog';

    async is_admin(): Promise<IsAdminResult> {
        try {
            return await this.callFunc<IsAdminParam, IsAdminResult>('is_admin', null);
        } catch (ex) {
            console.error('ERROR', ex);
            throw ex;
        }
    }

    get_exec_aggr_table(param: GetExecAggrTableParam): Promise<Array<GetExecAggrTableResult>> {
        return this.callFunc<GetExecAggrTableParam, Array<GetExecAggrTableResult>>('get_exec_aggr_table', param);
    }

    get_exec_aggr_stats(param: GetExecAggrStatsParam): Promise<Array<GetExecAggrStatsResult>> {
        return this.callFunc<GetExecAggrStatsParam, Array<GetExecAggrStatsResult>>('get_exec_aggr_stats', param);
    }

    list_basic_module_info(param: ListBasicModuleInfoParams): Promise<ListBasicModuleInfoResult> {
        return this.callFunc<ListBasicModuleInfoParams, ListBasicModuleInfoResult>('list_basic_module_info', param);
    }
}
