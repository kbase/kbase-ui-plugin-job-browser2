import {
    Job, JobsSearchExpression, StoreState, UserJobsViewData, JobSearchState
} from '../store';
import { serviceJobToUIJob, extractTimeRange } from './utils';
import { Action } from 'redux';
import { ActionType } from '.';
import { AppError } from '@kbase/ui-components';
import { ThunkDispatch } from 'redux-thunk';
import CancelableRequest, { Task } from '../../lib/CancelableRequest';
import JobBrowserBFFClient, { QueryJobsParams, FilterSpec } from '../../lib/JobBrowserBFFClient';
import { EpochTime } from '../types/base';
import { ComponentLoadingState } from '../store/base';
import { UIError } from '../types/error';

// Loading
export interface UserJobsLoadLoading extends Action<ActionType.USER_JOBS_LOAD_LOADING> {
    type: ActionType.USER_JOBS_LOAD_LOADING;
}

export interface UserJobsLoadError extends Action<ActionType.USER_JOBS_LOAD_ERROR> {
    type: ActionType.USER_JOBS_LOAD_ERROR;
    error: UIError;
}

export interface UserJobsLoadSuccess extends Action<ActionType.USER_JOBS_LOAD_SUCCESS> {
    type: ActionType.USER_JOBS_LOAD_SUCCESS;
    data: UserJobsViewData;
}

export function userJobsLoadLoading(): UserJobsLoadLoading {
    return {
        type: ActionType.USER_JOBS_LOAD_LOADING
    };
}

export function userJobsLoadError(error: UIError): UserJobsLoadError {
    return {
        type: ActionType.USER_JOBS_LOAD_ERROR,
        error
    };
}

export function userJobsLoadSuccess(data: UserJobsViewData): UserJobsLoadSuccess {
    return {
        type: ActionType.USER_JOBS_LOAD_SUCCESS,
        data
    };
}

// Search

export interface UserJobsSearch extends Action<ActionType.USER_JOBS_SEARCH> {
    type: ActionType.USER_JOBS_SEARCH;
    searchExpression: JobsSearchExpression;
}

export interface UserJobsSearchStart extends Action<ActionType.USER_JOBS_SEARCH_START> {
    type: ActionType.USER_JOBS_SEARCH_START;
}

export interface UserJobsSearchSuccess extends Action<ActionType.USER_JOBS_SEARCH_SUCCESS> {
    type: ActionType.USER_JOBS_SEARCH_SUCCESS;
    searchExpression: JobsSearchExpression;
    jobs: Array<Job>;
    foundCount: number;
    totalCount: number;
    jobsFetchedAt: EpochTime;
}

export interface UserJobsSearchError extends Action<ActionType.USER_JOBS_SEARCH_ERROR> {
    type: ActionType.USER_JOBS_SEARCH_ERROR;
    error: AppError;
}

export function userJobsSearchStart(): UserJobsSearchStart {
    return {
        type: ActionType.USER_JOBS_SEARCH_START
    };
}

export function userJobsSearchSuccess(
    jobs: Array<Job>,
    foundCount: number,
    totalCount: number,
    jobsFetchedAt: EpochTime,
    searchExpression: JobsSearchExpression,
): UserJobsSearchSuccess {
    return {
        type: ActionType.USER_JOBS_SEARCH_SUCCESS,
        searchExpression,
        jobs,
        foundCount,
        totalCount,
        jobsFetchedAt
    };
}

export function userJobsSearchError(error: AppError): UserJobsSearchError {
    return {
        type: ActionType.USER_JOBS_SEARCH_ERROR,
        error
    };
}

interface UserJobsParam {
    token: string,
    searchExpression: JobsSearchExpression;
    serviceWizardURL: string,
}

type UserJobsResult = {
    jobs: Array<Job>,
    foundCount: number,
    totalCount: number;
};

class UserJobsRequest extends CancelableRequest<UserJobsParam, UserJobsResult> {
    request({ token, searchExpression, serviceWizardURL }: UserJobsParam): Task<UserJobsResult> {

        const jobBrowserBFF = new JobBrowserBFFClient({
            token,
            url: serviceWizardURL,
        });

        const [timeRangeStart, timeRangeEnd] = extractTimeRange(searchExpression.timeRange);

        const filter: FilterSpec = {
            status: searchExpression.jobStatus
        };

        // TODO: better parsing of search, or do it before here...
        // const searchTerms = searchExpression.query.split(/\s+/);
        // if (searchTerms.length > 0) {
        //     if (!(searchTerms.length === 1 && searchTerms[0] === '')) {
        //         filter.user = searchTerms;
        //     }
        // }


        const queryParams: QueryJobsParams = {
            time_span: {
                from: timeRangeStart,
                to: timeRangeEnd
            }, // TODO: really handle sort
            offset: searchExpression.offset,
            limit: searchExpression.limit,
            timeout: 10000,
            admin: true,
            // search: {
            //     terms: searchTerms
            // },
            filter
        };

        // console.log('query params', queryParams);

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
                        return serviceJobToUIJob(jobInfo, 'UNKNOWN');
                    }),
                    foundCount: found_count,
                    totalCount: total_count
                };
            });

        const task: Task<UserJobsResult> = {
            id: this.newID(),
            promise,
            isCanceled: false
        };
        this.pendingTasks.set(task.id, task);
        return task;
    }
}

const userJobsSearchRequest = new UserJobsRequest();

export function userJobsLoad() {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(userJobsLoadLoading());

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
                userJobsSearchError({
                    message: 'Not authorized',
                    code: 'unauthorized'
                })
            );
            return;
        }

        const searchExpression: JobsSearchExpression = {
            forceSearch: true,
            jobStatus: ["create", "queue", "run", "complete", "error", "terminate"],
            offset: 0,
            limit: 1,
            query: '',
            sort: {
                field: 'created',
                direction: 'descending'
            },
            timeRange: {
                kind: 'preset',
                preset: 'lastWeek'
            }
        };
        const initialData: UserJobsViewData = {
            searchState: JobSearchState.INITIAL_SEARCHING,
            searchExpression
        };
        dispatch(userJobsLoadSuccess(initialData));

        const task = userJobsSearchRequest.spawn({
            token: userAuthorization.token,
            serviceWizardURL,
            searchExpression
        });


        // const task = userJobsSearchRequest.spawn({
        //     token: userAuthorization.token,
        //     serviceWizardURL,
        //     searchExpression
        // });

        const { jobs, foundCount, totalCount } = await task.promise;

        if (task.isCanceled) {
            // just do nothing
            return;
        }
        const jobsFetchedAt = new Date().getTime();
        userJobsSearchRequest.done(task);

        dispatch(userJobsSearchSuccess(jobs, foundCount, totalCount, jobsFetchedAt, searchExpression));
    };
}

export function userJobsSearch(searchExpression: JobsSearchExpression) {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(userJobsSearchStart());

        const {
            auth: { userAuthorization },
            app: {
                config: {
                    services: {
                        ServiceWizard: { url: serviceWizardURL }
                    }
                }
            },
            views: {
                userJobsView
            }
        } = getState();

        if (!userAuthorization) {
            dispatch(
                userJobsSearchError({
                    message: 'Not authorized',
                    code: 'unauthorized'
                })
            );
            return;
        }

        if (userJobsView.loadingState !== ComponentLoadingState.SUCCESS) {
            dispatch(
                userJobsSearchError({
                    message: 'Invalid State',
                    code: 'invalid-loading-state'
                })
            );
            return;
        }

        const task = userJobsSearchRequest.spawn({
            token: userAuthorization.token,
            serviceWizardURL,
            searchExpression
        });

        const { jobs, foundCount, totalCount } = await task.promise;
        if (task.isCanceled) {
            // just do nothing
            return;
        }
        userJobsSearchRequest.done(task);
        const jobsFetchedAt = new Date().getTime();

        dispatch(userJobsSearchSuccess(jobs, foundCount, totalCount, jobsFetchedAt, searchExpression));
    };
}

export function userJobsRefreshSearch() {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(userJobsSearchStart());

        const {
            auth: { userAuthorization }
        } = getState();

        if (!userAuthorization) {
            dispatch(
                userJobsSearchError({
                    message: 'Not authorized',
                    code: 'unauthorized'
                })
            );
            return;
        }

        const {
            app: {
                config: {
                    services: {
                        ServiceWizard: { url: serviceWizardURL }
                    }
                }
            },
            views: {
                userJobsView
            }
        } = getState();

        if (userJobsView.loadingState !== ComponentLoadingState.SUCCESS) {
            dispatch(
                userJobsSearchError({
                    message: 'Invalid State',
                    code: 'invalid-loading-state'
                })
            );
            return;
        }

        if (userJobsView.data.searchState === JobSearchState.ERROR) {
            return;
        }

        dispatch(userJobsSearchStart());


        const searchExpression = userJobsView.data.searchExpression;

        if (!searchExpression) {
            userJobsSearchError({
                message: 'No search expression',
                code: 'nosearchexpression'
            });
            return;
        }

        const task = userJobsSearchRequest.spawn({
            token: userAuthorization.token,
            serviceWizardURL,
            searchExpression
        });

        const { jobs, foundCount, totalCount } = await task.promise;

        if (task.isCanceled) {
            // just do nothing
            return;
        }

        userJobsSearchRequest.done(task);

        dispatch(userJobsSearchSuccess(jobs, foundCount, totalCount, Date.now(), searchExpression));
    };
}

// user job cancellation...
// Job Cancelation

export interface UserJobsCancelJob {
    type: ActionType.USER_JOBS_CANCEL;
    jobID: string;
}

export interface UserJobsCancelJobStart {
    type: ActionType.USER_JOBS_CANCEL_START;
}

export interface UserJobsCancelJobSuccess {
    type: ActionType.USER_JOBS_CANCEL_SUCCESS;
}

export interface UserJobsCancelJobError {
    type: ActionType.USER_JOBS_CANCEL_ERROR;
    error: AppError;
}

export function userJobsCancelJobStart(): UserJobsCancelJobStart {
    return {
        type: ActionType.USER_JOBS_CANCEL_START
    };
}

export function userJobsCancelJobSuccess(): UserJobsCancelJobSuccess {
    return {
        type: ActionType.USER_JOBS_CANCEL_SUCCESS
    };
}

export function userJobsCancelJobError(error: AppError): UserJobsCancelJobError {
    return {
        type: ActionType.USER_JOBS_CANCEL_ERROR,
        error
    };
}

export function userJobsCancelJob(jobID: string, timeout: number) {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(userJobsCancelJobStart());

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
                userJobsCancelJobError({
                    message: 'no authorization',
                    code: 'no-authorization'
                })
            );
            return;
        }

        // do it
        const client = new JobBrowserBFFClient({
            url: serviceWizardURL,
            token: userAuthorization.token
        });
        client
            .cancel_job({
                job_id: jobID,
                timeout,
                admin: true
            })
            .then(() => {
                dispatch(userJobsCancelJobSuccess());
                dispatch(userJobsRefreshSearch());
            })
            .catch((err) => {
                console.error('error canceling job', err);
                dispatch(
                    userJobsCancelJobError({
                        message: 'error canceling job: ' + err.message,
                        code: 'error-canceling'
                    })
                );
            });
    };
}
