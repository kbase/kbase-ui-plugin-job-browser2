import { makeAuthStoreInitialState } from 'kbase-ui-lib';
import reducer from './reducers';
import { createStore, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { AppError } from 'kbase-ui-lib';
import { BaseStoreState } from 'kbase-ui-lib';
import { makeIntegrationStoreInitialState } from 'kbase-ui-lib';

export enum JobStatus {
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    FINISHED = 'FINISHED',
    ERRORED = 'ERRORED',
    CANCELED = 'CANCELED'
}

export interface JobLogLine {
    lineNumber: number;
    line: string;
    isError: boolean;
}

export interface JobLog {
    isLoaded: boolean;
    lines: Array<JobLogLine>;
}

export interface Job {
    id: string;
    key: string;
    narrativeID: number | null;
    narrativeTitle: string;
    appID: string;
    appTitle: string;
    queuedAt: EpochTime;
    runAt: EpochTime | null;
    finishAt: EpochTime | null;
    queuedElapsed: number;
    runElapsed: number | null;
    status: JobStatus;
    message: string;
    clientGroups: Array<string>;
    username: string;
    log: JobLog;
}

interface JobsState {
    jobs: Array<Job>;
}

export type EpochTime = number;

export type TimeRangePresets = 'lastHour' | 'last48Hours' | 'lastWeek' | 'lastMonth';

export interface TimeRangePreset {
    kind: 'preset';
    preset: TimeRangePresets;
}

export interface TimeRangeLiteral {
    kind: 'literal';
    start: EpochTime;
    end: EpochTime;
}

export type TimeRange = TimeRangePreset | TimeRangeLiteral;

export interface TimeRange2 {
    preset: TimeRangePresets;
    start: EpochTime | null;
    end: EpochTime | null;
}

export interface JobsSearchExpression {
    query: string;
    timeRange: TimeRange;
    // timeRangeStart: EpochTime;
    // timeRangeEnd: EpochTime;
    jobStatus: Array<JobStatus>;
    forceSearch: boolean;
}

export enum SearchState {
    NONE = 0,
    SEARCHING,
    SEARCHED,
    ERROR
}

export enum ComponentLoadingState {
    NONE = 0,
    LOADING,
    SUCCESS,
    ERROR
}

// The Store!

export interface MainView {
    loadingState: ComponentLoadingState;
    error: AppError | null;
    isAdmin: boolean;
}

export interface MyJobsView {
    searchState: SearchState;
    searchExpression: JobsSearchExpression | null;
    jobsFetchedAt: EpochTime | null;
    rawJobs: Array<Job>;
    jobs: Array<Job>;
}

export interface UserJobsView {
    searchState: SearchState;
    searchExpression: JobsSearchExpression | null;
    jobsFetchedAt: EpochTime | null;
    rawJobs: Array<Job>;
    jobs: Array<Job>;
}

export interface StoreState extends BaseStoreState {
    // entities: {
    //     jobs: {
    //         byId: Map<string, Job>
    //     }
    // },
    views: {
        mainView: MainView;
        myJobsView: MyJobsView;
        userJobsView: UserJobsView;
        publicAppStatsView: PublicAppStatsView;
        userRunSummaryView: UserRunSummaryView;
    };
}

// App Stats

export interface PublicAppStatsQuery {
    query: string;
}

export interface PublicAppStatsView {
    searchState: SearchState;
    rawAppStats: Array<AppStat>;
    appStats: Array<AppStat>;
    query: PublicAppStatsQuery;
}

export interface AppStat {
    appId: string;
    functionId: string;
    functionTitle: string;
    moduleId: string;
    moduleTitle: string;
    runCount: number;
    errorCount: number;
    successRate: number;
    averageRunTime: number;
    averageQueueTime: number;
    totalRunTime: number;
}

/**
 * User Run Summary types
 */

export interface UserRunSummaryQuery {
    query: string;
}

export interface UserRunSummaryStat {
    username: string;
    appId: string;
    moduleId: string;
    functionId: string;
    runCount: number;
}

export interface UserRunSummaryView {
    searchState: SearchState;
    userRunSummary: Array<UserRunSummaryStat>;
    query: UserRunSummaryQuery;
}

export function makeInitialStoreState(): StoreState {
    const jobs: Array<Job> = [];
    const appStore = makeIntegrationStoreInitialState();
    const authStore = makeAuthStoreInitialState();
    return {
        ...appStore,
        ...authStore,
        views: {
            mainView: {
                loadingState: ComponentLoadingState.NONE,
                error: null,
                isAdmin: false
            },
            myJobsView: {
                searchState: SearchState.NONE,
                searchExpression: null,
                jobsFetchedAt: null,
                rawJobs: jobs,
                jobs
            },
            userJobsView: {
                searchState: SearchState.NONE,
                searchExpression: null,
                jobsFetchedAt: null,
                rawJobs: jobs,
                jobs
            },
            publicAppStatsView: {
                searchState: SearchState.NONE,
                rawAppStats: [],
                appStats: [],
                query: {
                    query: ''
                }
            },
            userRunSummaryView: {
                searchState: SearchState.NONE,
                userRunSummary: [],
                query: {
                    query: ''
                }
            }
        }
    };
}

export function createReduxStore() {
    return createStore(reducer, makeInitialStoreState(), compose(applyMiddleware(thunk)));
}
