export enum ActionType {
    MAIN_LOAD = 'main load',
    MAIN_LOAD_START = 'main load start',
    MAIN_LOAD_SUCCESS = 'main load success',
    MAIN_LOAD_ERROR = 'main load error',
    MAIN_UNLOAD = 'main/unload',

    MY_JOBS_LOAD_LOADING = 'my jobs loading',
    MY_JOBS_LOAD_SUCCESS = 'my jobs load success',
    MY_JOBS_LOAD_ERROR = 'my jobs load error',
    MY_JOBS_SEARCH = 'my jobs search',
    MY_JOBS_SEARCH_START = 'my jobs search start',
    MY_JOBS_SEARCH_SUCCESS = 'my jobs search success',
    MY_JOBS_SEARCH_ERROR = 'my jobs search error',
    MY_JOBS_REFRESH_SEARCH = 'my jobs refresh search',
    // MY_JOBS_SEARCH_RANGE = 'my jobs search time range',
    // MY_JOBS_SEARCH_SORT = 'my jobs search change sort',
    MY_JOBS_CANCEL = 'my jobs cancel',
    MY_JOBS_CANCEL_START = 'my jobs cancel start',
    MY_JOBS_CANCEL_SUCCESS = 'my jobs cancel success',
    MY_JOBS_CANCEL_ERROR = 'my jobs cancel error',

    USER_JOBS_LOAD_LOADING = 'user jobs loading',
    USER_JOBS_LOAD_SUCCESS = 'user jobs load success',
    USER_JOBS_LOAD_ERROR = 'user jobs load error',
    USER_JOBS_SEARCH = 'user jobs search',
    USER_JOBS_SEARCH_START = 'user jobs search start',
    USER_JOBS_SEARCH_SUCCESS = 'user jobs search success',
    USER_JOBS_SEARCH_ERROR = 'user jobs search error',

    USER_JOBS_CANCEL = 'user jobs cancel',
    USER_JOBS_CANCEL_START = 'user jobs cancel start',
    USER_JOBS_CANCEL_SUCCESS = 'user jobs cancel success',
    USER_JOBS_CANCEL_ERROR = 'user jobs cancel error',

    PUBLIC_APP_STATS_LOAD_LOADING = 'publicAppStats/Load/Loading',
    PUBLIC_APP_STATS_LOAD_SUCCESS = 'publicAppStats/Load/Success',
    PUBLIC_APP_STATS_LOAD_ERROR = 'publicAppStats/Load/Error',
    PUBLIC_APP_STATS_SEARCH = 'publicAppStats/Search',
    PUBLIC_APP_STATS_SEARCH_START = 'publicAppStats/Search/Start',
    PUBLIC_APP_STATS_SEARCH_ERROR = 'publicAppStats/Search/Error',
    PUBLIC_APP_STATS_SEARCH_SUCCESS = 'publicAppStats/Search/Success',

    USER_RUN_SUMMARY_LOAD_LOADING = 'userRunSummary/Load/Loading',
    USER_RUN_SUMMARY_LOAD_SUCCESS = 'userRunSummary/Load/Success',
    USER_RUN_SUMMARY_LOAD_ERROR = 'userRunSummary/Load/Error',
    USER_RUN_SUMMARY_SEARCH = 'userRunSummary/Search',
    USER_RUN_SUMMARY_SEARCH_START = 'userRunSummary/Search/Start',
    USER_RUN_SUMMARY_SEARCH_ERROR = 'userRunSummary/Search/Error',
    USER_RUN_SUMMARY_SEARCH_SUCCESS = 'userRunSummary/Search/Success'
}

// function fakeJobs() {
//     function randomStatus(): JobStatus {
//         const i = Math.floor(Math.random() * 4);
//         return [JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.FINISHED, JobStatus.ERRORED][i];
//     }

//     function createJobs(jobCount: number) {
//         const testJobs: Array<Job> = [];

//         const dayMs = 1000 * 60 * 60 * 24;
//         const now = Date.now();

//         for (let i = 0; i < jobCount; i++) {
//             testJobs.push({
//                 key: 'narrative_id_' + i,
//                 narrativeTitle: 'narrative ' + i + ' here',
//                 narrativeID: i,
//                 appTitle: 'app here',
//                 appID: String(i),
//                 submittedAt: new Date(now - dayMs * (jobCount - i)).getTime(),
//                 queuedAt: new Date(now - dayMs * (jobCount - i)).getTime(),
//                 runAt: new Date(now - dayMs * (jobCount - i)).getTime(),
//                 finishAt: new Date(now - dayMs * (jobCount - i)).getTime(),
//                 queuedElapsed: 1000 * 100 * Math.random(),
//                 runElapsed: 1000 * 100 * Math.random(),
//                 status: randomStatus()
//             });
//         }

//         return testJobs;
//     }

//     const jobCount = Math.floor(Math.random() * 200);

//     return createJobs(jobCount);
// }

// async function fetchMyJobsx(): Promise<Array<Job>> {
//     return new Promise((resolve, reject) => {
//         window.setTimeout(() => {
//             resolve(fakeJobs());
//         }, 3000);
//     });
// }

// All user jobs, for admins.
// This is separate, because it exposes different information in the view.
