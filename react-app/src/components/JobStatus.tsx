import React from 'react';
import { Tag, Icon } from 'antd';
import { JobStatus, Job } from '../redux/store';
import { NiceElapsedTime, NiceRelativeTime } from '@kbase/ui-components';

/**
* Translates a job status value to a label, with optional icon, suitable for
* display as the child of the job status tag.
*
* @param status - the status of the job
*
* @note Since the switch is over an enum, we don't have to worry about the default case
*/
function jobStatusLabel(status: JobStatus): JSX.Element | string {
    switch (status) {
        case JobStatus.QUEUED:
            return (
                <span>
                    <Icon type="loading" spin /> Queued
                </span>
            );
        case JobStatus.RUNNING:
            return (
                <span>
                    <Icon type="loading-3-quarters" spin /> Running
                </span>
            );
        case JobStatus.CANCELED_QUEUED:
        case JobStatus.CANCELED_RUNNING:
            return 'Canceled';
        case JobStatus.FINISHED:
            return 'Success';
        case JobStatus.ERRORED:
            return 'Errored';
        default:
            throw new Error('Invalid job status');
    }
}

/**
 * Translates a job status value to a color value acceptable for the color
 * prop for the job status tag.
 *
 * @param status - the status of the job
 */
export function jobColor(status: JobStatus): string {
    switch (status) {
        case JobStatus.QUEUED:
            return 'orange';
        case JobStatus.RUNNING:
            return 'blue';
        case JobStatus.CANCELED_QUEUED:
        case JobStatus.CANCELED_RUNNING:
            return 'gray';
        case JobStatus.FINISHED:
            return 'green';
        case JobStatus.ERRORED:
            return 'red';
        default:
            throw new Error('Invalid job status');
    }
}

export interface JobStatusProps {
    job: Job
    showTiming?: boolean
}

interface JobStatusState {

}

export default class JobStatusComponent extends React.Component<JobStatusProps, JobStatusState> {

    renderTag() {
        const label = jobStatusLabel(this.props.job.status);
        const color = jobColor(this.props.job.status);
        return <Tag color={color}>{label}</Tag>
    }

    renderTiming() {
        switch (this.props.job.status) {
            case JobStatus.QUEUED:
                return <span>
                    <NiceElapsedTime from={this.props.job.queuedAt} useClock={true} />
                </span>
            case JobStatus.RUNNING:
                return <span>
                    <NiceElapsedTime from={this.props.job.runAt} useClock={true} />
                </span>
            case JobStatus.FINISHED:
            case JobStatus.ERRORED:
            case JobStatus.CANCELED_QUEUED:
            case JobStatus.CANCELED_RUNNING:
                return <span>
                    <NiceRelativeTime time={new Date(this.props.job.finishAt)} />
                </span>
        }
    }

    render() {
        const timing = this.props.showTiming ? this.renderTiming() : '';
        return (
            <span>
                {this.renderTag()}
                {timing}
            </span>
        )
    }
}