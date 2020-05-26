import { Action } from 'redux';
import { ActionType } from '.';
import {
    JobsSearchExpression, Job, StoreState,
    MyJobsViewData, JobSearchState
} from '../store';
import { AppError } from '@kbase/ui-components';
import { serviceJobToUIJob, extractTimeRange } from './utils';
import { ThunkDispatch } from 'redux-thunk';
import CancelableRequest, { Task } from '../../lib/CancelableRequest';
import JobBrowserBFFClient, { QueryJobsParams } from '../../lib/JobBrowserBFFClient';
import { EpochTime } from '../types/base';
import { UIError } from '../types/error';
import { SERVICE_TIMEOUT } from '../../constants';

// MY JOBS TAB

// Loading
export interface MyJobsLoadLoading extends Action<ActionType.MY_JOBS_LOAD_LOADING> {
    type: ActionType.MY_JOBS_LOAD_LOADING;
}

export interface MyJobsLoadError extends Action<ActionType.MY_JOBS_LOAD_ERROR> {
    type: ActionType.MY_JOBS_LOAD_ERROR;
    error: UIError;
}

export interface MyJobsLoadSuccess extends Action<ActionType.MY_JOBS_LOAD_SUCCESS> {
    type: ActionType.MY_JOBS_LOAD_SUCCESS;
    data: MyJobsViewData;
}

export function myJobsLoadLoading(): MyJobsLoadLoading {
    return {
        type: ActionType.MY_JOBS_LOAD_LOADING
    };
}

export function myJobsLoadError(error: UIError): MyJobsLoadError {
    return {
        type: ActionType.MY_JOBS_LOAD_ERROR,
        error
    };
}

export function myJobsLoadSuccess(data: MyJobsViewData): MyJobsLoadSuccess {
    return {
        type: ActionType.MY_JOBS_LOAD_SUCCESS,
        data
    };
}

// Search

export interface MyJobsSearch extends Action<ActionType.MY_JOBS_SEARCH> {
    type: ActionType.MY_JOBS_SEARCH;
    searchExpression: JobsSearchExpression;
}

export interface MyJobsSearchStart extends Action<ActionType.MY_JOBS_SEARCH_START> {
    type: ActionType.MY_JOBS_SEARCH_START;
}

export interface MyJobsSearchSuccess extends Action<ActionType.MY_JOBS_SEARCH_SUCCESS> {
    type: ActionType.MY_JOBS_SEARCH_SUCCESS;
    searchExpression: JobsSearchExpression;
    jobs: Array<Job>;
    foundCount: number;
    totalCount: number;
    jobsFetchedAt: EpochTime;
}

export interface MyJobsSearchError extends Action<ActionType.MY_JOBS_SEARCH_ERROR> {
    type: ActionType.MY_JOBS_SEARCH_ERROR;
    error: AppError;
}

export function myJobsSearchStart() {
    return {
        type: ActionType.MY_JOBS_SEARCH_START
    };
}

export function myJobsSearchSuccess(
    jobs: Array<Job>,
    foundCount: number,
    totalCount: number,
    jobsFetchedAt: EpochTime,
    searchExpression: JobsSearchExpression
): MyJobsSearchSuccess {
    return {
        type: ActionType.MY_JOBS_SEARCH_SUCCESS,
        searchExpression,
        jobs,
        foundCount,
        totalCount,
        jobsFetchedAt
    };
}

export function myJobsSearchError(error: AppError) {
    return {
        type: ActionType.MY_JOBS_SEARCH_ERROR,
        error
    };
}

interface MyJobsParam {
    token: string,
    searchExpression: JobsSearchExpression;
    username: string,
    serviceWizardURL: string,
}

type MyJobsResult = {
    jobs: Array<Job>,
    foundCount: number,
    totalCount: number;
};

class MyJobsRequests extends CancelableRequest<MyJobsParam, MyJobsResult> {
    request({ token, searchExpression, username, serviceWizardURL }: MyJobsParam): Task<MyJobsResult> {
        const jobBrowserBFF = new JobBrowserBFFClient({
            token,
            url: serviceWizardURL,
            timeout: SERVICE_TIMEOUT
        });

        const [timeRangeStart, timeRangeEnd] = extractTimeRange(searchExpression.timeRange);

        // let filter: FilterSpec;
        // let s: JobsSearchExpression;
        // if (searchExpression.

        // const filter: FilterSpec = {
        //     status: searchExpression.jobStatus
        // };

        // TODO: better parsing of search, or do it before here...
        // const searchTerms = searchExpression.query.split(/\s+/);

        const queryParams: QueryJobsParams = {
            time_span: {
                from: timeRangeStart,
                to: timeRangeEnd
            }, // TODO: really handle sort
            offset: searchExpression.offset,
            limit: searchExpression.limit,
            timeout: SERVICE_TIMEOUT,
            // search: {
            //     terms: searchTerms
            // },
            filter: searchExpression.filter
        };

        if (searchExpression.sort) {
            switch (searchExpression.sort.field) {
                case 'created':
                    queryParams.sort = [{
                        key: 'created',
                        direction: searchExpression.sort.direction
                    }];
            }
        }

        const promise = jobBrowserBFF
            .query_jobs(queryParams)
            .then(({ jobs, found_count, total_count }) => {
                return {
                    jobs: jobs.map((jobInfo) => {
                        return serviceJobToUIJob(jobInfo, username);
                    }),
                    foundCount: found_count,
                    totalCount: total_count
                };
            });

        const task: Task<MyJobsResult> = {
            id: this.newID(),
            promise,
            isCanceled: false
        };
        this.pendingTasks.set(task.id, task);
        return task;
    }
}

export function myJobsLoad() {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(myJobsLoadLoading());

        const {
            auth: { userAuthorization },
            app: {
                config: {
                    services: {
                        ServiceWizard: { url: serviceWizardURL }
                    }
                }
            },
        } = getState();

        if (!userAuthorization) {
            dispatch(
                myJobsSearchError({
                    message: 'Not authorized',
                    code: 'unauthorized'
                })
            );
            return;
        }
        const initialData: MyJobsViewData = {
            searchState: JobSearchState.NONE
        };
        dispatch(myJobsLoadSuccess(initialData));
    };
}

// Job Cancelation

export interface MyJobsCancelJob {
    type: ActionType.MY_JOBS_CANCEL;
    jobID: string;
    timeout: number;
}

export interface MyJobsCancelJobStart {
    type: ActionType.MY_JOBS_CANCEL_START;
}

export interface MyJobsCancelJobSuccess {
    type: ActionType.MY_JOBS_CANCEL_SUCCESS;
}

export interface MyJobsCancelJobError {
    type: ActionType.MY_JOBS_CANCEL_ERROR;
    error: AppError;
}

export function myJobsCancelJobStart(): MyJobsCancelJobStart {
    return {
        type: ActionType.MY_JOBS_CANCEL_START
    };
}

export function myJobsCancelJobSuccess(): MyJobsCancelJobSuccess {
    return {
        type: ActionType.MY_JOBS_CANCEL_SUCCESS
    };
}

export function myJobsCancelJobError(error: AppError): MyJobsCancelJobError {
    return {
        type: ActionType.MY_JOBS_CANCEL_ERROR,
        error
    };
}

export function myJobsCancelJob(jobID: string, timeout: number) {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(myJobsCancelJobStart());

        const {
            auth: { userAuthorization },
            app: {
                config: {
                    services: {
                        ServiceWizard: { url: serviceWizardURL }
                    }
                }
            }
        } = getState();

        if (!userAuthorization) {
            dispatch(
                myJobsCancelJobError({
                    message: "no authorization",
                    code: "no-authorization"
                })
            );
            return;
        }

        // do it
        const client = new JobBrowserBFFClient({
            url: serviceWizardURL,
            token: userAuthorization.token,
            timeout: SERVICE_TIMEOUT
        });
        client
            .cancel_job({
                job_id: jobID,
                timeout,
                admin: false
            })
            .then(() => {
                dispatch(myJobsCancelJobSuccess());
            })
            .catch(err => {
                console.error("error canceling job", err);
                dispatch(
                    myJobsCancelJobError({
                        message: "error canceling job: " + err.message,
                        code: "error-canceling"
                    })
                );
            });
    };
}
