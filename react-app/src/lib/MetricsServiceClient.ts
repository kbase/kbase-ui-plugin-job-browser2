import { DynamicServiceClient, DynamicServiceClientParams } from '@kbase/ui-lib';

// Metrics client --
// TODO: move
// TODO: use a more dynamic dynamic service client??

interface MetricsServiceParams extends DynamicServiceClientParams {}

interface GetAppMetricsParam {
    epoch_range: [number, number];
    user_ids: Array<string>;
}

export interface JobState {
    app_id: string;
    client_groups: Array<string>;
    user?: string;

    complete: boolean;
    error: boolean;
    status: string;

    creation_time: number;
    exec_start_time?: number;
    modification_time?: number;
    finish_time?: number;

    job_id: string;
    method: string;

    wsid: string;
    narrative_objNo: number;

    narrative_name: string;
    workspace_name: string;
}

interface GetAppMetricsResult {
    job_states: Array<JobState>;
}

export default class MetricsServiceClient extends DynamicServiceClient {
    static module: string = 'kb_Metrics';

    async getAppMetrics({ epoch_range, user_ids }: GetAppMetricsParam): Promise<GetAppMetricsResult> {
        const [result] = await this.callFunc<[GetAppMetricsResult]>('get_app_metrics', [
            {
                epoch_range,
                user_ids
            }
        ]);

        return result;
    }
}
