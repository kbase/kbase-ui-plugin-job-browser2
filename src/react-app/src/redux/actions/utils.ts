import { JobStatus, Job, EpochTime, TimeRangePresets, TimeRange } from '../store';
import { JobState } from '../../lib/MetricsServiceClient';

function getJobStatus(job: JobState): JobStatus {
    // Use most reliable fields first.
    if (job.complete) {
        if (job.error) {
            return JobStatus.ERRORED;
        } else {
            if (job.status === 'done') {
                return JobStatus.FINISHED;
            }
            if (job.status.startsWith('canceled')) {
                return JobStatus.CANCELED;
            }
            console.log('detection error', job);
            throw new Error('Cannot detect job state');
        }
    } else {
        if (!job.status || job.status === 'queued') {
            return JobStatus.QUEUED;
        }
        // Various status values indicate the job is running, but
        // we don't need any more evidence because that is the only possible
        // other job state.
        // E.g. 'in-progress', 'running', 'starting job so that it can be finished'

        return JobStatus.RUNNING;
    }

    // if (job.status === 'Unknown error') {
    //     return JobStatus.ERRORED;
    // }
    // console.log('detection error', job);
    // throw new Error('Cannot detect job state');
}

export function serviceJobToUIJob(job: JobState, username: string): Job {
    let now = Date.now();

    const status = getJobStatus(job);

    let queuedElapsed;
    let runElapsed;
    let finishAt;

    switch (status) {
        case JobStatus.QUEUED:
            queuedElapsed = now - job.creation_time;
            runElapsed = null;
            finishAt = null;
            break;
        case JobStatus.RUNNING:
            queuedElapsed = job.exec_start_time! - job.creation_time;
            runElapsed = now - job.exec_start_time!;
            finishAt = null;
            break;
        case JobStatus.FINISHED:
        case JobStatus.ERRORED:
        case JobStatus.CANCELED:
            queuedElapsed = job.exec_start_time! - job.creation_time;
            runElapsed = job.finish_time! - job.exec_start_time!;
            finishAt = job.finish_time!;
            break;
        default:
            throw new Error('Invalid job status: ' + job.status);
    }

    // let finishAt;
    // if (job.complete) {
    //     finishAt = job.finish_time || null;
    // } else {
    //     finishAt = null;
    // }

    // if (job.exec_start_time) {
    //     queuedElapsed = job.exec_start_time - job.creation_time;
    // } else {
    //     queuedElapsed = now - job.exec_start_time!;
    // }

    // if (finishAt) {
    //     runElapsed = finishAt - job.exec_start_time!;
    // } else if (job.exec_start_time) {
    //     runElapsed = now - job.exec_start_time;
    // } else {
    //     runElapsed = null;
    // }

    let narrativeID;
    if (job.wsid) {
        narrativeID = parseInt(job.wsid, 10);
    } else {
        narrativeID = null;
    }

    return {
        key: job.job_id,
        id: job.job_id,
        status,
        message: job.status,
        appID: job.app_id,
        appTitle: job.app_id,
        narrativeID,
        narrativeTitle: job.narrative_name,
        queuedAt: job.creation_time,
        runAt: job.exec_start_time! || null,
        finishAt,
        queuedElapsed,
        runElapsed,
        clientGroups: job.client_groups,
        // TODO: a more affirmative method of providing current username
        // for querying for own...?
        username: job.user || username,
        log: {
            isLoaded: false,
            lines: []
        }
    };
}

export function compareTimeRange(job: Job, timeRangeStart: EpochTime, timeRangeEnd: EpochTime) {
    // if any of the timestamps fall within the time range, we are good
    if (
        [job.queuedAt, job.runAt, job.finishAt].some((eventTime) => {
            if (!eventTime) {
                return false;
            }
            return eventTime > timeRangeStart && eventTime < timeRangeEnd;
        })
    ) {
        return true;
    }

    // If the timestamps span the time range, we are also good.
    if (!job.queuedAt) {
        return false;
    }
    // if start past the end time, no match.
    if (job.queuedAt > timeRangeEnd) {
        return false;
    }
    // If start after or on start time, then, we have a match.
    if (job.queuedAt >= timeRangeStart) {
        return true;
    }

    // Otherwise, the job started (queued) before out time range, but
    // there is still hope, maybe it is still queued or started after the
    // start date.
    if (!job.runAt) {
        // Not run yet, a match.
        return true;
    }
    // Otherwise, if it starts after the range start, a match
    if (job.runAt >= timeRangeStart) {
        return true;
    }

    // Otherwise, yes, there is still hope...

    // If not finished yet, a match.
    if (!job.finishAt) {
        return true;
    }

    // Otherwise, if it finished after the range start, a match
    if (job.finishAt >= timeRangeStart) {
        return true;
    }

    return false;
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
