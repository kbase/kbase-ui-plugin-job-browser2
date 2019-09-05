import { DynamicServiceClient, DynamicServiceClientParams } from '@kbase/ui-lib';

// Metrics client --
// TODO: move
// TODO: use a more dynamic dynamic service client??

interface MetricsServiceParams extends DynamicServiceClientParams { }


export interface JobState {
    app_id: string;
    client_groups: Array<string>;
    user?: string;

    complete: boolean;
    error: boolean;
    status: string;
    state: string;

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


interface GetAppMetricsParam {
    epoch_range: [number, number];
    user_ids: Array<string>;
}
interface GetAppMetricsResult {
    job_states: Array<JobState>;
}

interface GetJobsParam {
    epoch_range: [number, number];
    user_ids: Array<string>;
}
interface GetJobsResult {
    job_states: Array<JobState>;
    total_count: number;
}

interface GetJobParam {
    job_id: string;
}
interface GetJobResult {
    job_state: JobState;
}

export default class MetricsServiceClient extends DynamicServiceClient {
    static module: string = 'kb_Metrics';

    async getJobs({ epoch_range, user_ids }: GetJobsParam): Promise<GetJobsResult> {
        const result = await this.callFunc<[GetJobsParam], [GetJobsResult]>('get_jobs', [
            {
                epoch_range,
                user_ids
            }
        ]);
        return result[0];
    }

    async getJob({ job_id }: GetJobParam): Promise<GetJobResult> {
        const result = await this.callFunc<[GetJobParam], [GetJobResult]>('get_job', [
            {
                job_id
            }
        ]);
        return result[0];
    }

    async getAppMetrics({ epoch_range, user_ids }: GetAppMetricsParam): Promise<GetAppMetricsResult> {
        const result = await this.callFunc<[GetAppMetricsParam], [GetAppMetricsResult]>('get_job', [
            {
                epoch_range,
                user_ids
            }
        ]);
        return result[0];
    }
}
