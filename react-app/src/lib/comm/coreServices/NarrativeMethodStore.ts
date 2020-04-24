import { ServiceClient } from '../ServiceClient';


export interface ListMethodsParams {
    offset?: number;
    limit?: number;
    tag?: string;
}

/*
  string id;
        string module_name;
        string git_commit_hash;
        string name;
        string ver;
        string subtitle;
        string tooltip;
        Icon icon;
        list<string> categories;
        string loading_error;
        list <username> authors;
        list <string> input_types;
        list <string> output_types;
        string app_type;
*/

export interface Icon {
    url: string;
}
export interface MethodBriefInfo {
    id: string;
    module_name: string;
    git_commit_hash: string;
    name: string;
    ver: string;
    subtitle: string;
    tooltip: string;
    icon: Icon;
    categories: Array<string>;
    loading_error: string;
    authors: Array<string>;
    input_types: Array<string>;
    output_types: Array<string>;
    app_type: string;
}

type ListMethodsResult = Array<MethodBriefInfo>;

export default class NarrativeMethodStoreClient extends ServiceClient {
    module: string = 'NarrativeMethodStore';

    async list_methods(param: ListMethodsParams): Promise<ListMethodsResult> {
        return this.callFunc<ListMethodsParams, ListMethodsResult>('list_methods', param);
    }
}
