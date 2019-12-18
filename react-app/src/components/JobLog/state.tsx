import React from 'react';
import { Job, JobID } from '../../redux/store';
import JobLogComponent from './view';
import { Spin, Alert } from 'antd';
import { serviceJobToUIJob } from '../../redux/actions/utils';
import JobBrowserBFFClient from '../../lib/JobBrowserBFFClient';
import { JobEvent, JobStateType } from '../../redux/types/jobState';

const POLLING_INTERVAL = 5000;

// A simple state wrapper for job logs.

export interface JobLogEntry {
    lineNumber: number;
    loggedAt: Date,
    message: string;
    isError: boolean;
}
export enum JobLogState {
    NONE,
    JOB_QUEUED,
    INITIAL_LOADING,
    ACTIVE_LOADED,
    ACTIVE_LOADING,
    FINISHED_LOADED,
    ERROR
}

export interface JobLogViewNone {
    status: JobLogState.NONE
}

export interface JobLogViewQueued {
    status: JobLogState.JOB_QUEUED
}

export interface JobLogViewInitialLoading {
    status: JobLogState.INITIAL_LOADING
}

export interface JobLogViewActiveLoaded {
    status: JobLogState.ACTIVE_LOADED,
    log: Array<JobLogEntry>;
    job: Job
}

export interface JobLogViewActiveLoading {
    status: JobLogState.ACTIVE_LOADING,
    log: Array<JobLogEntry>;
    job: Job
}

export interface JobLogViewFinishedLoaded {
    status: JobLogState.FINISHED_LOADED,
    log: Array<JobLogEntry>;
    job: Job
}

export interface JobLogViewError {
    status: JobLogState.ERROR,
    error: string
}

export type JobLogView = JobLogViewNone | JobLogViewQueued | JobLogViewInitialLoading | JobLogViewActiveLoaded | JobLogViewActiveLoading | JobLogViewFinishedLoaded | JobLogViewError

export interface JobLogsStateProps {
    jobID: JobID;
    token: string;
    njsURL: string;
    serviceWizardURL: string;
}

type JobLogsStateState = JobLogView;

export default class JobLogsState extends React.Component<JobLogsStateProps, JobLogsStateState> {
    constructor(props: JobLogsStateProps) {
        super(props);

        this.state = {
            status: JobLogState.NONE
        };
    }

    async getJob(): Promise<Job> {
        const jobBrowserBFF = new JobBrowserBFFClient({
            token: this.props.token,
            url: this.props.serviceWizardURL,
        });

        const jobs = await jobBrowserBFF.get_jobs({
            job_ids: [this.props.jobID],
            // TODO: admin??
            admin: 0,
            // TODO: from config
            timeout: 10000
        });

        return serviceJobToUIJob(jobs.jobs[0], 'UNKNOWN');
    }

    async getJobLog(offset: number, limit: number, timeout: number, admin: boolean): Promise<Array<JobLogEntry>> {
        const jobBrowserBFF = new JobBrowserBFFClient({
            token: this.props.token,
            url: this.props.serviceWizardURL,
        });


        const jobLog = await jobBrowserBFF.get_job_log({
            job_id: this.props.jobID,
            offset, limit, timeout,
            admin: admin ? 1 : 0
        });

        return jobLog.log.map((entry) => {
            return {
                lineNumber: entry.row,
                message: entry.message,
                isError: entry.level === 'error',
                loggedAt: new Date(entry.logged_at)
            };
        });
    }

    currentJobState(job: Job): JobEvent {
        return job.eventHistory[job.eventHistory.length - 1];
    }

    startPolling() {
        const poller = async () => {
            const state = this.state;
            if (state.status !== JobLogState.ACTIVE_LOADED) {
                this.setState({
                    status: JobLogState.ERROR,
                    error: 'Invalid state for polling: ' + state.status
                });
                return;
            }
            const { log } = state;
            this.setState({
                status: JobLogState.ACTIVE_LOADING,
                log
            });
            const job = await this.getJob();
            const offset = log.length;
            // TODO: how to mimic offset at end of log (above, done), and 
            // an indefinite limit? For now, just use 1000.
            const limit = 1000;
            // TODO: get from somewhere else... 
            const timeout = 10000;
            // TODO: get from somewhere else...
            const admin = false;
            const newLog = await this.getJobLog(offset, limit, timeout, admin)

            switch (this.currentJobState(job).type) {
                case JobStateType.CREATE:
                case JobStateType.QUEUE:
                    // should not occur!
                    this.startQueuedPolling();
                    break;
                case JobStateType.RUN:
                    this.setState({
                        status: JobLogState.ACTIVE_LOADED,
                        log: log.concat(newLog),
                        job
                    });
                    loop();
                    break;
                default:
                    this.setState({
                        status: JobLogState.FINISHED_LOADED,
                        log: log.concat(newLog),
                        job
                    });
            }
        }
        const loop = () => {
            setTimeout(poller, POLLING_INTERVAL);
        }
        loop();
    }

    startQueuedPolling() {
        // TODO: how to mimic offset at end of log (above, done), and 
        // an indefinite limit? For now, just use 1000.
        const limit = 1000;
        // TODO: get from somewhere else... 
        const timeout = 10000;
        // TODO: get from somewhere else...
        const admin = false;

        const poller = async () => {
            const job = await this.getJob();
            switch (this.currentJobState(job).type) {
                case JobStateType.CREATE:
                case JobStateType.QUEUE:
                    // still queued, eh?
                    loop();
                    return;
                case JobStateType.RUN:
                    var log = await this.getJobLog(0, limit, timeout, admin);
                    this.setState({
                        status: JobLogState.ACTIVE_LOADED,
                        log,
                        job
                    });
                    loop();
                    break;
                default:
                    var log = await this.getJobLog(0, limit, timeout, admin);
                    this.setState({
                        status: JobLogState.FINISHED_LOADED,
                        log,
                        job
                    });
            }
        }

        const loop = () => {
            setTimeout(poller, POLLING_INTERVAL);
        }

        loop();
    }

    async getInitialJobLog() {
        this.setState({
            status: JobLogState.INITIAL_LOADING
        });
        const job = await this.getJob();

        // TODO: how to mimic offset at end of log (above, done), and 
        // an indefinite limit? For now, just use 1000.
        const limit = 1000;
        // TODO: get from somewhere else... 
        const timeout = 10000;
        // TODO: get from somewhere else...
        const admin = false;

        let log;
        switch (this.currentJobState(job).type) {
            case JobStateType.CREATE:
            case JobStateType.QUEUE:
                // still queued, eh?
                this.setState({
                    status: JobLogState.JOB_QUEUED
                });
                this.startQueuedPolling();
                return;
            case JobStateType.RUN:
                log = await this.getJobLog(0, limit, timeout, admin);
                this.setState({
                    status: JobLogState.ACTIVE_LOADED,
                    log,
                    job
                });
                return;
            default:
                log = await this.getJobLog(0, limit, timeout, admin);
                this.setState({
                    status: JobLogState.FINISHED_LOADED,
                    log,
                    job
                });
                return;
        }
    }

    componentDidMount() {
        this.getInitialJobLog();
    }

    renderLoading() {
        return (
            <div>
                Loading ... <Spin />
            </div>
        );
    }

    renderQueued() {
        return (
            <div>
                Queued ... <Spin />
            </div>
        );
    }

    renderError(view: JobLogViewError) {
        return (
            <Alert type="error" message={view.error} />
        )
    }

    render() {
        return this.renderLoading();
    }

    renderx() {
        const state = this.state;
        switch (state.status) {
            case JobLogState.NONE:
            case JobLogState.JOB_QUEUED:
                return this.renderQueued();
            case JobLogState.INITIAL_LOADING:
                return this.renderLoading();
            case JobLogState.ERROR:
                return this.renderError(state);
            case JobLogState.ACTIVE_LOADED:
            case JobLogState.ACTIVE_LOADING:
                return <JobLogComponent job={state.job} log={state.log} />;
            case JobLogState.FINISHED_LOADED:
                return <JobLogComponent job={state.job} log={state.log} />;
        }
    }
}
