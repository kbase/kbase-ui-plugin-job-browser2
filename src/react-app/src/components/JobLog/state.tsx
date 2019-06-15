import React from 'react';
import { JobLog, JobLogLine } from '../../redux/store';
import JobLogComponent from './view';
import { Spin } from 'antd';
import { NarrativeJobServiceClient } from '@kbase/ui-lib';

// A simple state wrapper for job logs.

export interface JobLogsStateProps {
    jobId: string;
    token: string;
    njsURL: string;
}

interface JobLogsStateState {
    log: JobLog;
}

export default class JobLogsState extends React.Component<JobLogsStateProps, JobLogsStateState> {
    constructor(props: JobLogsStateProps) {
        super(props);

        this.state = {
            log: {
                isLoaded: false,
                lines: []
            }
        };
    }

    componentDidMount() {
        const njsClient = new NarrativeJobServiceClient({
            token: this.props.token,
            url: this.props.njsURL,
            module: 'NarrativeJobService'
        });

        njsClient
            .getJobLogs({ job_id: this.props.jobId, skip_lines: 0 })
            .then(([jobLog]) => {
                const lines: Array<JobLogLine> = jobLog.lines.map((line, index) => {
                    return {
                        lineNumber: index + 1,
                        line: line.line,
                        isError: line.is_error ? true : false
                    };
                });
                this.setState({
                    log: {
                        isLoaded: true,
                        lines
                    }
                });
            })
            .catch((err) => {
                console.error('boo', err);
            });
    }

    render() {
        if (!this.state.log.isLoaded) {
            return (
                <div>
                    Loading ... <Spin />
                </div>
            );
        }
        return <JobLogComponent log={this.state.log} />;
    }
}
