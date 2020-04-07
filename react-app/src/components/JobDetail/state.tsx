import React from 'react';
import { Job, JobID } from '../../redux/store';
import JobDetailComponent from './view';
import { serviceJobToUIJob } from '../../redux/actions/utils';
import JobBrowserBFFClient from '../../lib/JobBrowserBFFClient';
import { JobLogEntry } from '../JobLog/state';
import { JobStateType, JobEvent } from '../../redux/types/jobState';

const POLLING_INTERVAL = 5000;

// A simple state wrapper for job logs.

export type JobLog = Array<JobLogEntry>;

export enum JobLogState {
    NONE,
    JOB_QUEUED,
    INITIAL_LOADING,
    ACTIVE_LOADED,
    ACTIVE_LOADING,
    FINISHED_LOADED,
    ERROR
}

// TODO: rename this and other things to JobDetailView...
export interface JobLogViewNone {
    status: JobLogState.NONE;
}

export interface JobLogViewQueued {
    status: JobLogState.JOB_QUEUED;
    job: Job;
}

export interface JobLogViewInitialLoading {
    status: JobLogState.INITIAL_LOADING;
}

export interface JobLogViewActiveLoaded {
    status: JobLogState.ACTIVE_LOADED,
    log: Array<JobLogEntry>;
    job: Job;
}

export interface JobLogViewActiveLoading {
    status: JobLogState.ACTIVE_LOADING,
    log: Array<JobLogEntry>;
    job: Job;
}

export interface JobLogViewFinishedLoaded {
    status: JobLogState.FINISHED_LOADED,
    log: Array<JobLogEntry>;
    job: Job;
}

export interface JobLogViewError {
    status: JobLogState.ERROR,
    error: string;
}

export type JobLogView =
    JobLogViewNone |
    JobLogViewQueued |
    JobLogViewInitialLoading |
    JobLogViewActiveLoaded |
    JobLogViewActiveLoading |
    JobLogViewFinishedLoaded |
    JobLogViewError;

export interface JobLogsStateProps {
    jobID: JobID;
    token: string;
    njsURL: string;
    serviceWizardURL: string;
    admin: boolean;
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
            admin: this.props.admin ? 1 : 0,
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

    // async updateJobLog() {
    //     const startingLines = this.state.log.length;
    //     const lines = await this.getJobLog(startingLines);
    //     this.setState({
    //         log: {
    //             isLoaded: this.state.log.isLoaded,
    //             lines: this.state.log.lines.concat(lines)
    //         }
    //     })
    // }

    isJobQueued(job: Job): boolean {
        const currentState = job.eventHistory[job.eventHistory.length - 1];
        return (currentState.type === JobStateType.QUEUE || currentState.type === JobStateType.CREATE);
    }

    isJobRunning(job: Job): boolean {
        const currentState = job.eventHistory[job.eventHistory.length - 1];
        return (currentState.type === JobStateType.RUN);
    }

    currentJobState(job: Job): JobEvent {
        return job.eventHistory[job.eventHistory.length - 1];
    }

    startRunningPolling() {
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
            const newLog = await this.getJobLog(offset, limit, timeout, admin);

            if (this.isJobQueued(job)) {
                this.startQueuedPolling();
            } else if (this.isJobRunning(job)) {
                this.setState({
                    status: JobLogState.ACTIVE_LOADED,
                    log: log.concat(newLog),
                    job
                });
                loop();
            } else {
                this.setState({
                    status: JobLogState.FINISHED_LOADED,
                    log: log.concat(newLog),
                    job
                });
            }
        };
        const loop = () => {
            setTimeout(poller, POLLING_INTERVAL);
        };
        loop();
    }

    startQueuedPolling() {
        const poller = async () => {
            try {
                const job = await this.getJob();

                // TODO: how to mimic offset at end of log (above, done), and 
                // an indefinite limit? For now, just use 1000.
                const limit = 1000;
                // TODO: get from somewhere else... 
                const timeout = 10000;
                // TODO: get from somewhere else...
                const admin = false;

                if (this.isJobQueued(job)) {
                    loop();
                } else if (this.isJobRunning(job)) {
                    const log = await this.getJobLog(0, limit, timeout, admin);
                    this.setState({
                        status: JobLogState.ACTIVE_LOADED,
                        log,
                        job
                    });
                    this.startRunningPolling();
                } else {
                    const log = await this.getJobLog(0, limit, timeout, admin);
                    switch (this.currentJobState(job).type) {
                        case JobStateType.COMPLETE:
                            this.setState({
                                status: JobLogState.FINISHED_LOADED,
                                log,
                                job
                            });
                            break;
                        case JobStateType.ERROR:
                            this.setState({
                                status: JobLogState.ERROR,
                                log,
                                job
                            });
                            break;
                        case JobStateType.TERMINATE:
                            this.setState({
                                status: JobLogState.FINISHED_LOADED,
                                log,
                                job
                            });
                            break;
                    }
                }
            } catch (ex) {
                console.error('ERROR', ex);
            }
        };

        const loop = () => {
            setTimeout(poller, POLLING_INTERVAL);
        };

        loop();
    }

    async getInitialJobLog() {
        this.setState({
            status: JobLogState.INITIAL_LOADING
        });
        const job = await this.getJob();
        // const log = await this.getJobLog(0);

        // TODO: how to mimic offset at end of log (above, done), and 
        // an indefinite limit? For now, just use 1000.
        const limit = 1000;
        // TODO: get from somewhere else... 
        const timeout = 10000;
        // TODO: get from somewhere else...
        const admin = false;

        let log;

        // console.log('getInitialJobLog: Got Job', this.currentJobState(job).type, job);

        switch (this.currentJobState(job).type) {
            case JobStateType.CREATE:
            case JobStateType.QUEUE:
                // still queued, eh?
                this.setState({
                    status: JobLogState.JOB_QUEUED,
                    job
                });
                this.startQueuedPolling();
                return;
            case JobStateType.RUN:
                try {
                    log = await this.getJobLog(0, limit, timeout, admin);
                    this.setState({
                        status: JobLogState.ACTIVE_LOADED,
                        log,
                        job
                    });
                    this.startRunningPolling();
                } catch (ex) {
                    this.setState({
                        status: JobLogState.ERROR,
                        error: ex.message
                    });
                }
                return;
            case JobStateType.COMPLETE:
            case JobStateType.ERROR:
            case JobStateType.TERMINATE:
                try {
                    log = await this.getJobLog(0, limit, timeout, admin);
                    this.setState({
                        status: JobLogState.FINISHED_LOADED,
                        log,
                        job
                    });
                } catch (ex) {
                    this.setState({
                        status: JobLogState.ERROR,
                        error: ex.message
                    });
                }
                return;
        }
    }

    componentDidMount() {
        this.getInitialJobLog();
    }

    render() {
        return <JobDetailComponent view={this.state} />;
    }
}
