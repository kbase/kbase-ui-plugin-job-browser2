import { makeBaseStoreState } from '@kbase/ui-components';
import reducer from './reducers';
import { createStore, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { AppError } from '@kbase/ui-components';
import { BaseStoreState } from '@kbase/ui-components';

export enum JobStatus {
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    FINISHED = 'FINISHED',
    ERRORED = 'ERRORED',
    CANCELED_QUEUED = 'CANCELED_QUEUED',
    CANCELED_RUNNING = 'CANCELED_RUNNING'
}

export type JobID = string;



// export interface Job {
//     id: JobID;
//     key: string;
//     narrativeID: number | null;
//     narrativeTitle: string;
//     appID: string;
//     appTitle: string;
//     queuedAt: EpochTime;
//     runAt: EpochTime | null;
//     finishAt: EpochTime | null;
//     queuedElapsed: number;
//     runElapsed: number | null;
//     status: JobStatus;
//     message: string;
//     clientGroups: Array<string>;
//     username: string;
// }

// export enum TemporalState {
//     NONE,
//     QUEUED,
//     RUNNING
// }

// export enum PermanentState {
//     NONE,
//     SUCCESS,
//     ERROR,
//     CANCEL
// }

// export interface JobQueuedState {
//     tstate: TemporalState.QUEUED;
//     pstate: PermanentState.NONE;

//     id: JobID;
//     key: string;
//     narrativeID: number | null;
//     narrativeTitle: string;
//     appID: string;
//     appTitle: string;
//     queuedAt: EpochTime;
//     queuedElapsed: number;
//     clientGroups: Array<string>;
//     username: string;
// }

// export interface JobRunningState {
//     tstate: TemporalState.RUNNING;
//     pstate: PermanentState.NONE;

//     id: JobID;
//     key: string;
//     narrativeID: number | null;
//     narrativeTitle: string;
//     appID: string;
//     appTitle: string;
//     queuedAt: EpochTime;
//     runAt: EpochTime;
//     queuedElapsed: number;
//     runElapsed: number;
//     clientGroups: Array<string>;
//     username: string;
// }

// export interface JobFinishedState {
//     tstate: TemporalState.NONE;
//     pstate: PermanentState.SUCCESS;

//     id: JobID;
//     key: string;
//     narrativeID: number | null;
//     narrativeTitle: string;
//     appID: string;
//     appTitle: string;
//     queuedAt: EpochTime;
//     runAt: EpochTime;
//     finishAt: EpochTime;
//     queuedElapsed: number;
//     runElapsed: number;
//     clientGroups: Array<string>;
//     username: string;
// }

// export interface JobCanceledWhileQueuedState {
//     tstate: TemporalState.QUEUED;
//     pstate: PermanentState.SUCCESS;

//     id: JobID;
//     key: string;
//     narrativeID: number | null;
//     narrativeTitle: string;
//     appID: string;
//     appTitle: string;
//     queuedAt: EpochTime;
//     runAt: EpochTime;
//     finishAt: EpochTime;
//     queuedElapsed: number;
//     runElapsed: number;
//     clientGroups: Array<string>;
//     username: string;
// }


export interface JobQueued {
    status: JobStatus.QUEUED;
    id: JobID;
    key: string;
    narrativeID: number | null;
    narrativeTitle: string;
    appID: string;
    appTitle: string;
    queuedAt: EpochTime;
    queuedElapsed: number;
    clientGroups: Array<string>;
    username: string;
}

export interface JobRunning {
    status: JobStatus.RUNNING;
    id: JobID;
    key: string;
    narrativeID: number | null;
    narrativeTitle: string;
    appID: string;
    appTitle: string;
    queuedAt: EpochTime;
    runAt: EpochTime;
    queuedElapsed: number;
    runElapsed: number;
    clientGroups: Array<string>;
    username: string;
}

export interface JobFinished {
    status: JobStatus.FINISHED;
    id: JobID;
    key: string;
    narrativeID: number | null;
    narrativeTitle: string;
    appID: string;
    appTitle: string;
    queuedAt: EpochTime;
    runAt: EpochTime;
    finishAt: EpochTime;
    queuedElapsed: number;
    runElapsed: number;
    clientGroups: Array<string>;
    username: string;
}

export interface JobCanceledWhileQueued {
    status: JobStatus.CANCELED_QUEUED;
    id: JobID;
    key: string;
    narrativeID: number | null;
    narrativeTitle: string;
    appID: string;
    appTitle: string;
    queuedAt: EpochTime;
    finishAt: EpochTime;
    queuedElapsed: number;
    clientGroups: Array<string>;
    username: string;
}

export interface JobCanceledWhileRunning {
    status: JobStatus.CANCELED_RUNNING;
    id: JobID;
    key: string;
    narrativeID: number | null;
    narrativeTitle: string;
    appID: string;
    appTitle: string;
    queuedAt: EpochTime;
    runAt: EpochTime;
    finishAt: EpochTime;
    queuedElapsed: number;
    runElapsed: number;
    clientGroups: Array<string>;
    username: string;
}

export interface JobErrored {
    status: JobStatus.ERRORED;
    id: JobID;
    key: string;
    narrativeID: number | null;
    narrativeTitle: string;
    appID: string;
    appTitle: string;
    queuedAt: EpochTime;
    runAt: EpochTime;
    finishAt: EpochTime;
    queuedElapsed: number;
    runElapsed: number;
    message: string;
    clientGroups: Array<string>;
    username: string;
}

export type Job = JobQueued | JobRunning | JobFinished | JobCanceledWhileQueued | JobCanceledWhileRunning | JobErrored;

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

export interface MyStoreState {
    views: {
        mainView: MainView;
        myJobsView: MyJobsView;
        userJobsView: UserJobsView;
        publicAppStatsView: PublicAppStatsView;
        userRunSummaryView: UserRunSummaryView;
    };
}

export interface StoreState extends BaseStoreState, MyStoreState {
    // entities: {
    //     jobs: {
    //         byId: Map<string, Job>
    //     }
    // },

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
    const baseState = makeBaseStoreState();
    return {
        ...baseState,
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
