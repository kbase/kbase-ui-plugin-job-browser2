import React from 'react';
import { Tag, Icon } from 'antd';
import { JobStatus } from '../redux/store';

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
    jobStatus: JobStatus
}

interface JobStatusState {

}

export default class JobStatusComponent extends React.Component<JobStatusProps, JobStatusState> {
    render() {
        const label = jobStatusLabel(this.props.jobStatus);
        const color = jobColor(this.props.jobStatus);
        return <Tag color={color}>{label}</Tag>;
    }
}