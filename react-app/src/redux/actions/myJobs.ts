import { Action } from 'redux';
import { ActionType } from '.';
import { JobsSearchExpression, Job, EpochTime, StoreState } from '../store';
import { AppError, NarrativeJobServiceClient } from '@kbase/ui-lib';
import MetricsServiceClient from '../../lib/MetricsServiceClient';
import { serviceJobToUIJob, compareTimeRange, compareStatus, extractTimeRange } from './utils';
import { ThunkDispatch } from 'redux-thunk';

// MY JOBS TAB

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
    rawJobs: Array<Job>;
    jobs: Array<Job>;
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
    rawJobs: Array<Job>,
    jobs: Array<Job>,
    jobsFetchedAt: EpochTime,
    searchExpression: JobsSearchExpression
) {
    return {
        type: ActionType.MY_JOBS_SEARCH_SUCCESS,
        searchExpression,
        rawJobs,
        jobs,
        jobsFetchedAt
    };
}

export function myJobsSearchError(error: AppError) {
    return {
        type: ActionType.MY_JOBS_SEARCH_ERROR,
        error
    };
}

async function fetchMyJobs(
    token: string,
    username: string,
    serviceWizardUrl: string,
    from: number,
    to: number
): Promise<Array<Job>> {
    const client = new MetricsServiceClient({
        url: serviceWizardUrl,
        token: token
    });
    return client
        .getAppMetrics({
            epoch_range: [from, to],
            user_ids: [username]
        })
        .then((metrics) => {
            const converted = metrics.job_states.map((jobState) => {
                return serviceJobToUIJob(jobState, username);
            });
            return converted;
            // return fakeJobs();
        });
}

export function myJobsSearch(searchExpression: JobsSearchExpression) {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(myJobsSearchStart());

        const {
            auth: { userAuthorization }
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

        let {
            app: {
                config: {
                    services: {
                        ServiceWizard: { url: serviceWizardURL }
                    }
                }
            },
            views: {
                myJobsView: { jobsFetchedAt, rawJobs }
            }
        } = getState();

        const searchTerms = searchExpression.query.split(/\s+/).map((term) => {
            return new RegExp(term, 'i');
        });

        const [timeRangeStart, timeRangeEnd] = extractTimeRange(searchExpression.timeRange);

        if (!jobsFetchedAt || searchExpression.forceSearch) {
            rawJobs = await fetchMyJobs(
                userAuthorization.token,
                userAuthorization.username,
                serviceWizardURL,
                timeRangeStart,
                timeRangeEnd
            );
            jobsFetchedAt = new Date().getTime();
            // UPDATE: update the raw jobs
        }

        const newJobs = rawJobs.filter((job) => {
            return (
                searchTerms.every((term) => {
                    return term.test(job.appTitle) || term.test(job.narrativeTitle);
                }) &&
                compareTimeRange(job, timeRangeStart, timeRangeEnd) &&
                compareStatus(job, searchExpression.jobStatus)
            );
        });

        dispatch(myJobsSearchSuccess(rawJobs, newJobs, jobsFetchedAt, searchExpression));
    };
}

// Jobs refetch

export function myJobsRefreshSearch() {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(myJobsSearchStart());

        const {
            auth: { userAuthorization }
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

        const {
            app: {
                config: {
                    services: {
                        ServiceWizard: { url: serviceWizardURL }
                    }
                }
            },
            views: {
                myJobsView: { searchExpression }
            }
        } = getState();

        if (!searchExpression) {
            myJobsSearchError({
                message: 'No search expression',
                code: 'nosearchexpression'
            });
            return;
        }

        const [timeRangeStart, timeRangeEnd] = extractTimeRange(searchExpression.timeRange);

        const searchTerms = searchExpression.query.split(/\s+/).map((term) => {
            return new RegExp(term, 'i');
        });

        const rawJobs = await fetchMyJobs(
            userAuthorization.token,
            userAuthorization.username,
            serviceWizardURL,
            timeRangeStart,
            timeRangeEnd
        );

        const newJobs = rawJobs.filter((job) => {
            return (
                searchTerms.every((term) => {
                    return term.test(job.appTitle) || term.test(job.narrativeTitle);
                }) &&
                compareTimeRange(
                    job,
                    // searchExpression.timeRange,
                    timeRangeStart,
                    timeRangeEnd
                ) &&
                compareStatus(job, searchExpression.jobStatus)
            );
        });

        dispatch(myJobsSearchSuccess(rawJobs, newJobs, Date.now(), searchExpression));
    };
}

// JOB CANCELATION

// Job Cancelation

export interface MyJobsCancelJob {
    type: ActionType.MY_JOBS_CANCEL;
    jobID: string;
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

export function myJobsCancelJob(jobID: string) {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(myJobsCancelJobStart());

        const {
            auth: { userAuthorization },
            app: {
                config: {
                    services: {
                        NarrativeJobService: { url: njsURL }
                    }
                }
            }
        } = getState();

        if (!userAuthorization) {
            dispatch(
                myJobsCancelJobError({
                    message: 'no authorization',
                    code: 'no-authorization'
                })
            );
            return;
        }

        // do it
        const njsClient = new NarrativeJobServiceClient({
            url: njsURL,
            token: userAuthorization.token,
            module: 'NarrativeJobService'
        });
        njsClient
            .cancelJob({ job_id: jobID })
            .then(() => {
                dispatch(myJobsCancelJobSuccess());
                dispatch(myJobsRefreshSearch());
            })
            .catch((err) => {
                console.error('error canceling job', err);
                dispatch(
                    myJobsCancelJobError({
                        message: 'error canceling job: ' + err.message,
                        code: 'error-canceling'
                    })
                );
            });
    };
}
