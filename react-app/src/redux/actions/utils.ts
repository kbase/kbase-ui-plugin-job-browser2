import { JobStatus, Job, EpochTime, TimeRangePresets, TimeRange, JobQueued, JobRunning, JobFinished, JobCanceledWhileQueued, JobCanceledWhileRunning, JobErroredWhileQueued, JobErroredWhileRunning } from '../store';
import { JobState } from '../../lib/MetricsServiceClient';

function getJobStatus(job: JobState): JobStatus {
    switch (job.state) {
        case 'QUEUED': return JobStatus.QUEUED;
        case 'RUNNING': return JobStatus.RUNNING;
        case 'FINISHED': return JobStatus.FINISHED;
        case 'CANCELED_QUEUED': return JobStatus.CANCELED_QUEUED;
        case 'CANCELED_RUNNING': return JobStatus.CANCELED_QUEUED;

        // case 'ERRORED': return JobStatus.ERRORED;
        case 'ERRORED_QUEUED':
            console.warn('QUEUE_ERRORED', job);
            return JobStatus.ERRORED_QUEUED;
        case 'ERRORED_RUNNING':
            return JobStatus.ERRORED_RUNNING;
        default:
            throw new Error('Unknown job state: ' + job.state)
    }
    // Use most reliable fields first.
    // if (job.complete) {
    //     if (job.error) {
    //         return JobStatus.ERRORED;
    //     } else {
    //         if (job.status === 'done') {
    //             return JobStatus.FINISHED;
    //         }
    //         if (job.status.startsWith('canceled')) {
    //             return JobStatus.CANCELED;
    //         }
    //         if (job.status === 'Unknown error') {
    //             return JobStatus.ERRORED;
    //         }
    //         return JobStatus.ERRORED;
    //         // TODO: handle this error by creating a new job state - UNKNOWN
    //         // console.log('detection error', job);
    //         // throw new Error('Cannot detect job state');
    //     }
    // } else {
    //     if (!job.status || job.status === 'queued') {
    //         return JobStatus.QUEUED;
    //     }
    //     // Various status values indicate the job is running, but
    //     // we don't need any more evidence because that is the only possible
    //     // other job state.
    //     // E.g. 'in-progress', 'running', 'starting job so that it can be finished'

    //     return JobStatus.RUNNING;
    // }

    // if (job.status === 'Unknown error') {
    //     return JobStatus.ERRORED;
    // }
    // console.log('detection error', job);
    // throw new Error('Cannot detect job state');
}

function makeJobQueued(job: JobState, username: string): JobQueued {
    let narrativeID;
    if (job.wsid) {
        narrativeID = parseInt(job.wsid, 10);
    } else {
        narrativeID = null;
    }
    return {
        key: job.job_id,
        id: job.job_id,
        status: JobStatus.QUEUED,
        appID: job.app_id,
        appTitle: job.app_id,
        narrativeID,
        narrativeTitle: job.narrative_name,
        queuedAt: job.creation_time,
        // runAt: job.exec_start_time! || null,
        queuedElapsed: Date.now() - job.creation_time,
        clientGroups: job.client_groups,
        // TODO: a more affirmative method of providing current username
        // for querying for own...?
        username: job.user || username
    };
}

function makeJobRunning(job: JobState, username: string): JobRunning {
    let narrativeID;
    if (job.wsid) {
        narrativeID = parseInt(job.wsid, 10);
    } else {
        narrativeID = null;
    }
    if (!job.exec_start_time) {
        console.error('ERROR: Running job without exec_start_time!', job);
        throw new Error('Running job without exec_start_time!');
    }
    return {
        key: job.job_id,
        id: job.job_id,
        status: JobStatus.RUNNING,
        appID: job.app_id,
        appTitle: job.app_id,
        narrativeID,
        narrativeTitle: job.narrative_name,
        queuedAt: job.creation_time,
        runAt: job.exec_start_time,
        runElapsed: Date.now() - job.exec_start_time,
        queuedElapsed: Date.now() - job.creation_time,
        clientGroups: job.client_groups,
        // TODO: a more affirmative method of providing current username
        // for querying for own...?
        username: job.user || username
    };
}

function makeJobFinished(job: JobState, username: string): JobFinished {
    let narrativeID;
    if (job.wsid) {
        narrativeID = parseInt(job.wsid, 10);
    } else {
        narrativeID = null;
    }
    if (!job.exec_start_time) {
        throw new Error('Running job without exec_start_time!')
    }
    if (!job.finish_time) {
        throw new Error('Running job without finish_time!')
    }
    return {
        key: job.job_id,
        id: job.job_id,
        status: JobStatus.FINISHED,
        appID: job.app_id,
        appTitle: job.app_id,
        narrativeID,
        narrativeTitle: job.narrative_name,
        queuedAt: job.creation_time,
        runAt: job.exec_start_time,
        runElapsed: job.finish_time - job.exec_start_time,
        finishAt: job.finish_time,
        queuedElapsed: Date.now() - job.creation_time,
        clientGroups: job.client_groups,
        // TODO: a more affirmative method of providing current username
        // for querying for own...?
        username: job.user || username
    };
}

function makeJobCanceledQueued(job: JobState, username: string): JobCanceledWhileQueued {
    let narrativeID;
    if (job.wsid) {
        narrativeID = parseInt(job.wsid, 10);
    } else {
        narrativeID = null;
    }

    if (!job.finish_time) {
        throw new Error('Canceled job without finish_time!')
    }
    return {
        key: job.job_id,
        id: job.job_id,
        status: JobStatus.CANCELED_QUEUED,
        appID: job.app_id,
        appTitle: job.app_id,
        narrativeID,
        narrativeTitle: job.narrative_name,
        queuedAt: job.creation_time,
        queuedElapsed: Date.now() - job.creation_time,
        clientGroups: job.client_groups,
        finishAt: job.finish_time,
        // TODO: a more affirmative method of providing current username
        // for querying for own...?
        username: job.user || username
    };
}

function makeJobCanceledRunning(job: JobState, username: string): JobCanceledWhileRunning {
    let narrativeID;
    if (job.wsid) {
        narrativeID = parseInt(job.wsid, 10);
    } else {
        narrativeID = null;
    }
    if (!job.exec_start_time) {
        throw new Error('Canceled job without exec_start_time!')
    }
    if (!job.finish_time) {
        throw new Error('Canceled job without finish_time!')
    }
    return {
        key: job.job_id,
        id: job.job_id,
        status: JobStatus.CANCELED_RUNNING,
        appID: job.app_id,
        appTitle: job.app_id,
        narrativeID,
        narrativeTitle: job.narrative_name,
        queuedAt: job.creation_time,
        runAt: job.exec_start_time,
        runElapsed: job.finish_time - job.exec_start_time,
        finishAt: job.finish_time,
        queuedElapsed: Date.now() - job.creation_time,
        clientGroups: job.client_groups,
        // TODO: a more affirmative method of providing current username
        // for querying for own...?
        username: job.user || username
    };
}

function makeJobErroredQueued(job: JobState, username: string): JobErroredWhileQueued {
    let narrativeID;
    if (job.wsid) {
        narrativeID = parseInt(job.wsid, 10);
    } else {
        narrativeID = null;
    }
    if (!job.finish_time) {
        throw new Error('Errored job without finish_time!')
    }
    return {
        key: job.job_id,
        id: job.job_id,
        status: JobStatus.ERRORED_QUEUED,
        appID: job.app_id,
        appTitle: job.app_id,
        narrativeID,
        narrativeTitle: job.narrative_name,
        queuedAt: job.creation_time,
        finishAt: job.finish_time,
        queuedElapsed: Date.now() - job.creation_time,
        clientGroups: job.client_groups,
        message: job.status,
        // TODO: a more affirmative method of providing current username
        // for querying for own...?
        username: job.user || username
    };
}

function makeJobErroredRunning(job: JobState, username: string): JobErroredWhileRunning {
    let narrativeID;
    if (job.wsid) {
        narrativeID = parseInt(job.wsid, 10);
    } else {
        narrativeID = null;
    }
    if (!job.exec_start_time) {
        console.error('ERROR: Errored job without exec_start_time!', job);
        throw new Error('Errored job without exec_start_time!')
    }
    if (!job.finish_time) {
        throw new Error('Errored job without finish_time!')
    }
    return {
        key: job.job_id,
        id: job.job_id,
        status: JobStatus.ERRORED_RUNNING,
        appID: job.app_id,
        appTitle: job.app_id,
        narrativeID,
        narrativeTitle: job.narrative_name,
        queuedAt: job.creation_time,
        runAt: job.exec_start_time,
        runElapsed: job.finish_time - job.exec_start_time,
        finishAt: job.finish_time,
        queuedElapsed: Date.now() - job.creation_time,
        clientGroups: job.client_groups,
        message: job.status,
        // TODO: a more affirmative method of providing current username
        // for querying for own...?
        username: job.user || username
    };
}

export function serviceJobToUIJob(job: JobState, username: string): Job {
    const status = getJobStatus(job);
    switch (status) {
        case JobStatus.QUEUED:
            return makeJobQueued(job, username);
        case JobStatus.RUNNING:
            return makeJobRunning(job, username);
        case JobStatus.FINISHED:
            return makeJobFinished(job, username);
        case JobStatus.ERRORED_QUEUED:
            return makeJobErroredQueued(job, username);
        case JobStatus.ERRORED_RUNNING:
            return makeJobErroredRunning(job, username);
        case JobStatus.CANCELED_QUEUED:
            return makeJobCanceledQueued(job, username);
        case JobStatus.CANCELED_RUNNING:
            return makeJobCanceledRunning(job, username);
        default:
            throw new Error('Invalid job status: ' + job.status);
    }
}

export function compareTimeRange(job: Job, timeRangeStart: EpochTime, timeRangeEnd: EpochTime) {
    // // if any of the timestamps fall within the time range, we are good
    // if (
    //     [job.queuedAt, job.runAt, job.finishAt].some((eventTime) => {
    //         if (!eventTime) {
    //             return false;
    //         }
    //         return eventTime > timeRangeStart && eventTime < timeRangeEnd;
    //     })
    // ) {
    //     return true;
    // }

    // // If the timestamps span the time range, we are also good.
    // if (!job.queuedAt) {
    //     return false;
    // }
    // // if start past the end time, no match.
    // if (job.queuedAt > timeRangeEnd) {
    //     return false;
    // }
    // // If start after or on start time, then, we have a match.
    // if (job.queuedAt >= timeRangeStart) {
    //     return true;
    // }

    // // Otherwise, the job started (queued) before out time range, but
    // // there is still hope, maybe it is still queued or started after the
    // // start date.
    // if (!job.runAt) {
    //     // Not run yet, a match.
    //     return true;
    // }
    // // Otherwise, if it starts after the range start, a match
    // if (job.runAt >= timeRangeStart) {
    //     return true;
    // }

    // // Otherwise, yes, there is still hope...

    // // If not finished yet, a match.
    // if (!job.finishAt) {
    //     return true;
    // }

    // // Otherwise, if it finished after the range start, a match
    // if (job.finishAt >= timeRangeStart) {
    //     return true;
    // }

    // return false;
    return true;
}

export function compareStatus(job: Job, jobStatus?: Array<JobStatus>) {
    if (!jobStatus) {
        return true;
    }
    return jobStatus.some((status) => {
        return job.status === status;
    });
}

export function calcAverage(total: number, count: number) {
    if (total) {
        if (count) {
            return total / count;
        } else {
            return null;
        }
    } else {
        if (count) {
            return 0;
        } else {
            return null;
        }
    }
}

export function calcRate(part: number, whole: number) {
    if (part) {
        if (whole) {
            return part / whole;
        } else {
            return null;
        }
    } else {
        if (whole) {
            return 0;
        } else {
            return null;
        }
    }
}

export function getTimeRange(preset: TimeRangePresets): [EpochTime, EpochTime] {
    const hourInMilliseconds = 1000 * 60 * 60;
    const endDate = new Date().getTime();
    switch (preset) {
        case 'lastHour':
            return [endDate - hourInMilliseconds, endDate];
        case 'last48Hours':
            return [endDate - hourInMilliseconds * 24 * 2, endDate];
        case 'lastWeek':
            return [endDate - hourInMilliseconds * 24 * 7, endDate];
        case 'lastMonth':
            return [endDate - hourInMilliseconds * 24 * 30, endDate];
    }
}

export function extractTimeRange(timeRange: TimeRange): [EpochTime, EpochTime] {
    switch (timeRange.kind) {
        case 'preset':
            return getTimeRange(timeRange.preset);
        case 'literal':
            return [timeRange.start, timeRange.end];
        default:
            throw new Error('Invalid time range kind value (should be impossible');
    }
}
