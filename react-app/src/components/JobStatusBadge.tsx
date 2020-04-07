import React from 'react';
import { Tag, Icon } from 'antd';
import { Job } from '../redux/store';
import { NiceElapsedTime, NiceRelativeTime } from '@kbase/ui-components';
import { JobStateType, JobEvent } from '../redux/types/jobState';

function currentEvent(job: Job): JobEvent {
    return job.eventHistory[job.eventHistory.length - 1];
}

/**
* Translates a job status value to a label, with optional icon, suitable for
* display as the child of the job status tag.
*
* @param status - the status of the job
*
* @note Since the switch is over an enum, we don't have to worry about the default case
*/
function jobStatusLabel(job: Job): JSX.Element | string {
    switch (currentEvent(job).type) {
        case JobStateType.CREATE:
        case JobStateType.QUEUE:
            return (
                <span>
                    <Icon type="loading" spin /> Queued
                </span>
            );
        case JobStateType.RUN:
            return (
                <span>
                    <Icon type="loading-3-quarters" spin /> Running
                </span>
            );
        case JobStateType.COMPLETE:
            return 'Completed';
        case JobStateType.ERROR:
            return 'Errored';
        case JobStateType.TERMINATE:
            return 'Canceled';
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
export function jobColor(job: Job): string {
    switch (currentEvent(job).type) {
        case JobStateType.CREATE:
        case JobStateType.QUEUE:
            return 'orange';
        case JobStateType.RUN:
            return 'blue';
        case JobStateType.COMPLETE:
            return 'green';
        case JobStateType.ERROR:
            return 'red';
        case JobStateType.TERMINATE:
            return 'gray';
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

export default class JobStatusBadge extends React.Component<JobStatusProps, JobStatusState> {
    renderTag() {
        const label = jobStatusLabel(this.props.job);
        const color = jobColor(this.props.job);
        return <Tag color={color}>{label}</Tag>
    }

    renderTiming() {
        const job = this.props.job;
        const event = currentEvent(job);
        switch (event.type) {
            case JobStateType.CREATE:
                return <span>-</span>;
            case JobStateType.QUEUE:
            case JobStateType.RUN:
                return <NiceElapsedTime
                    from={event.at}
                    useClock={true} />;
            default:
                return <span>
                    <NiceRelativeTime time={new Date(event.at)} />
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
