import React from 'react';
import { Job, JobStatus } from '../redux/store';
import { NiceRelativeTime, NiceElapsedTime } from '@kbase/ui-components';
import JobStatusBadge, { jobColor } from './JobStatus';
import { Spin } from 'antd';

export interface Props {
    job: Job
}

interface State {

}

export default class JobInfo extends React.Component<Props, State> {
    renderSubmitted() {
        const date = this.props.job.queuedAt
        if (!date) {
            return <span>** empty **</span>;
        }
        return <NiceRelativeTime time={new Date(date)} />;
    }
    renderQueuedFor() {
        const job = this.props.job;
        switch (job.status) {
            case JobStatus.QUEUED:
                return <NiceElapsedTime from={job.queuedAt} precision={2} useClock={true} />;
            case JobStatus.RUNNING:
                return <NiceElapsedTime from={job.queuedAt} to={job.runAt} precision={2} />;
            case JobStatus.FINISHED:
                return <NiceElapsedTime from={job.queuedAt} to={job.runAt} precision={2} />;
            case JobStatus.CANCELED_QUEUED:
                return <NiceElapsedTime from={job.queuedAt} to={job.finishAt} precision={2} />;
            case JobStatus.CANCELED_RUNNING:
                return <NiceElapsedTime from={job.queuedAt} to={job.runAt} precision={2} />;
            case JobStatus.ERRORED_QUEUED:
                return <NiceElapsedTime from={job.queuedAt} to={job.finishAt} precision={2} />;
            case JobStatus.ERRORED_RUNNING:
                return <NiceElapsedTime from={job.queuedAt} to={job.runAt} precision={2} />;
        }
    }
    renderRunFor() {
        const job = this.props.job;
        switch (job.status) {
            case JobStatus.QUEUED:
                return <span>-</span>;
            case JobStatus.RUNNING:
                return <NiceElapsedTime from={job.runAt} precision={2} useClock={true} />;
            case JobStatus.FINISHED:
                return <NiceElapsedTime from={job.runAt} to={job.finishAt} precision={2} />;
            case JobStatus.CANCELED_QUEUED:
                return <span>-</span>;
            case JobStatus.CANCELED_RUNNING:
                return <NiceElapsedTime from={job.runAt} to={job.finishAt} precision={2} />;
            case JobStatus.ERRORED_QUEUED:
                return <span>-</span>;
            case JobStatus.ERRORED_RUNNING:
                return <NiceElapsedTime from={job.runAt} to={job.finishAt} precision={2} />;
        }
        // if (!this.props.job.runElapsed) {
        //     return <span>-</span>
        // }
        // return <NiceElapsedTime duration={this.props.job.runElapsed} precision={2} />;
    }

    renderStateSpinner(jobStatus: JobStatus) {
        if (this.props.job.status === jobStatus) {
            return <span>
                {' '}
                <Spin size="small" style={{ color: jobColor(jobStatus) }} />
            </span>
        }
    }

    render() {
        return (
            <div className="JobInfo InfoTable">
                <div className="InfoTable-row">
                    <div className="InfoTable-labelCol">
                        Job ID
                    </div>
                    <div className="InfoTable-dataCol">
                        {this.props.job.id}
                    </div>
                </div>
                <div className="InfoTable-row">
                    <div className="InfoTable-labelCol">
                        Status
                    </div>
                    <div className="InfoTable-dataCol">
                        <JobStatusBadge job={this.props.job} />
                    </div>
                </div>
                <div className="InfoTable-row">
                    <div className="InfoTable-labelCol">
                        Narrative
                    </div>
                    <div className="InfoTable-dataCol">
                        <a
                            href={`/narrative/${this.props.job.narrativeID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {this.props.job.narrativeTitle}
                        </a>
                    </div>
                </div>
                <div className="InfoTable-row">
                    <div className="InfoTable-labelCol">
                        App
                    </div>
                    <div className="InfoTable-dataCol">
                        <a href={`/#catalog/apps/${this.props.job.appID}`}>{this.props.job.appTitle}</a>
                    </div>
                </div>
                <div className="InfoTable-row">
                    <div className="InfoTable-labelCol">
                        Submitted
                    </div>
                    <div className="InfoTable-dataCol">
                        {this.renderSubmitted()}
                    </div>
                </div>
                <div className="InfoTable-row">
                    <div className="InfoTable-labelCol">
                        Queued For
                    </div>
                    <div className="InfoTable-dataCol">
                        {this.renderQueuedFor()}
                        {this.renderStateSpinner(JobStatus.QUEUED)}
                    </div>
                </div>
                <div className="InfoTable-row">
                    <div className="InfoTable-labelCol">
                        Run For
                </div>
                    <div className="InfoTable-dataCol">
                        {this.renderRunFor()}
                        {this.renderStateSpinner(JobStatus.RUNNING)}
                    </div>
                </div>
            </div>
        )
    }
}