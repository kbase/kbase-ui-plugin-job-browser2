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
import JobBrowserBFFClient, { QueryJobsParams, FilterSpec } from '../../lib/JobBrowserBFFClient';
import { EpochTime } from '../types/base';
import { ComponentLoadingState } from '../store/base';
import { UIError } from '../types/error';

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
    // from: number,
    // to: number,
    // offset: number,
    // limit: number
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
        });

        const [timeRangeStart, timeRangeEnd] = extractTimeRange(searchExpression.timeRange);

        const filter: FilterSpec = {
            status: searchExpression.jobStatus
        };

        // TODO: better parsing of search, or do it before here...
        const searchTerms = searchExpression.query.split(/\s+/);
        // TODO: remove - experiment with passing a search
        // as a filter.
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
            search: {
                terms: searchTerms
            },
            filter
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

        const searchExpression: JobsSearchExpression = {
            forceSearch: true,
            jobStatus: ["create", "queue", "run", "complete", "error", "terminate"],
            offset: 0,
            limit: 10,
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
        const initialData: MyJobsViewData = {
            searchState: JobSearchState.INITIAL_SEARCHING,
            searchExpression
        };
        dispatch(myJobsLoadSuccess(initialData));

        const task = myJobsSearchRequests.spawn({
            token: userAuthorization.token,
            username: userAuthorization.username,
            serviceWizardURL,
            searchExpression
        });

        const { jobs, foundCount, totalCount } = await task.promise;

        if (task.isCanceled) {
            // just do nothing
            return;
        }
        const jobsFetchedAt = new Date().getTime();
        myJobsSearchRequests.done(task);

        dispatch(myJobsSearchSuccess(jobs, foundCount, totalCount, jobsFetchedAt, searchExpression));
    };
}

const myJobsSearchRequests = new MyJobsRequests();

export function myJobsSearch(searchExpression: JobsSearchExpression) {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(myJobsSearchStart());

        const {
            auth: { userAuthorization }
        } = getState();

        if (!userAuthorization) {
            dispatch(
                myJobsSearchError({
                    message: "Not authorized",
                    code: "unauthorized"
                })
            );
            return;
        }

        let {
            app: {
                config: {
                    services: {
                        ServiceWizard: { url: serviceWizardURL }
                    }
                }
            },
            views: {
                myJobsView
            }
        } = getState();

        // Narrow the view
        if (myJobsView.loadingState !== ComponentLoadingState.SUCCESS) {
            myJobsSearchError({
                code: 'search-error',
                message: 'My Jobs Component not in correct state (SUCCESS)'
            });
            return;
        }

        // const searchTerms = searchExpression.query.split(/\s+/).map((term) => {
        //     return new RegExp(term, 'i');
        // });

        // Umm, there must be other conditions which make a real search happen, or is
        // forceSearch now the way to do this? ...

        const task = myJobsSearchRequests.spawn({
            token: userAuthorization.token,
            username: userAuthorization.username,
            serviceWizardURL,
            searchExpression
        });

        const { jobs, foundCount, totalCount } = await task.promise;
        if (task.isCanceled) {
            // just do nothing
            return;
        }
        const jobsFetchedAt = new Date().getTime();
        myJobsSearchRequests.done(task);


        // const newJobs = rawJobs.filter((job) => {
        //     return (
        //         searchTerms.every((term) => {
        //             return term.test(job.request.app.title) || term.test(job.request.narrative.title);
        //         }) &&
        //         compareTimeRange(job, timeRangeStart, timeRangeEnd) &&
        //         compareStatus(job, searchExpression.jobStatus)
        //     );
        // });

        dispatch(myJobsSearchSuccess(jobs, foundCount, totalCount, jobsFetchedAt, searchExpression));
    };
}

// Jobs refetch

export function myJobsRefreshSearch() {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {


        const {
            auth: { userAuthorization }
        } = getState();

        if (!userAuthorization) {
            dispatch(
                myJobsSearchError({
                    message: "Not authorized",
                    code: "unauthorized"
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
                myJobsView
            }
        } = getState();

        if (myJobsView.loadingState !== ComponentLoadingState.SUCCESS) {
            myJobsSearchError({
                code: 'search-error',
                message: 'My Jobs Component not in correct state (SUCCESS)'
            });
            return;
        }


        if (myJobsView.data.searchState === JobSearchState.ERROR) {
            return;
        }

        dispatch(myJobsSearchStart());


        const searchExpression = myJobsView.data.searchExpression;

        if (!searchExpression) {
            myJobsSearchError({
                message: "No search expression",
                code: "nosearchexpression"
            });
            return;
        }

        const task = myJobsSearchRequests.spawn({
            token: userAuthorization.token,
            username: userAuthorization.username,
            serviceWizardURL,
            searchExpression
        });

        const { jobs, foundCount, totalCount } = await task.promise;
        if (task.isCanceled) {
            // just do nothing
            return;
        }
        // jobsFetchedAt = new Date().getTime();
        myJobsSearchRequests.done(task);

        dispatch(myJobsSearchSuccess(jobs, foundCount, totalCount, Date.now(), searchExpression));
    };
}

// JOB CANCELATION

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
            token: userAuthorization.token
        });
        client
            .cancel_job({
                job_id: jobID,
                timeout,
                admin: false
            })
            .then(() => {
                dispatch(myJobsCancelJobSuccess());
                dispatch(myJobsRefreshSearch());
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
