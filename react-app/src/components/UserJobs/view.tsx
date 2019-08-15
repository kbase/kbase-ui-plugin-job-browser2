/**
 * A component for browsing through (search, filter, sort) jobs submitted by
 * the current user.
 */

// 3rd party imports
import React from 'react';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { ExpandIconProps } from 'antd/lib/table';
import { Table, Form, Input, Button, Tag, Icon, Checkbox, Select, DatePicker, Popconfirm, Tooltip } from 'antd';
import moment, { Moment } from 'moment';

// project imports (should be shared lib)
import { NiceRelativeTime } from '@kbase/ui-lib';
import { NiceTimeDuration } from '@kbase/ui-lib';

// project imports
import { Job, JobStatus, JobsSearchExpression, SearchState, TimeRange, TimeRangePresets } from '../../redux/store';
import JobLog from '../JobLog';

// file imports
import './style.css';
import Monitor from '../Monitor';

/*
    Props and State
*/

type JobStatusFilterKey = 'queued' | 'running' | 'canceled' | 'success' | 'error';

interface JobStatusFilterOption {
    label: string;
    value: JobStatusFilterKey;
}

const jobStatusFilterOptions: Array<JobStatusFilterOption> = [
    {
        label: 'Queued',
        value: 'queued'
    },
    {
        label: 'Running',
        value: 'running'
    },
    {
        label: 'Canceled',
        value: 'canceled'
    },
    {
        label: 'Success',
        value: 'success'
    },
    {
        label: 'Error',
        value: 'error'
    }
];

function jobStatusFilterOptionsToJobStatus(filter: Array<JobStatusFilterKey>): Array<JobStatus> {
    let jobStatuses: Array<JobStatus> = [];
    filter.forEach((status) => {
        switch (status) {
            case 'queued':
                jobStatuses.push(JobStatus.QUEUED);
                break;
            case 'running':
                jobStatuses.push(JobStatus.RUNNING);
                break;
            case 'canceled':
                jobStatuses.push(JobStatus.CANCELED);
                break;
            case 'success':
                jobStatuses.push(JobStatus.FINISHED);
                break;
            case 'error':
                jobStatuses.push(JobStatus.ERRORED);
                break;
        }
    });
    return jobStatuses;
}

function jobStatusLabel(status: JobStatus) {
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
        case JobStatus.CANCELED:
            return 'Canceled';
        case JobStatus.FINISHED:
            return 'Success';
        case JobStatus.ERRORED:
            return 'Errored';
        default:
            return 'UNKNOWN (' + status + ')';
    }
}

function jobColor(status: JobStatus): string {
    switch (status) {
        case JobStatus.QUEUED:
            return 'orange';
        case JobStatus.RUNNING:
            return 'blue';
        case JobStatus.CANCELED:
            return 'gray';
        case JobStatus.FINISHED:
            return 'green';
        case JobStatus.ERRORED:
            return 'red';
        default:
            return 'UNKNOWN';
    }
}

function renderJobStatus(status: JobStatus) {
    let label = jobStatusLabel(status);
    let color = jobColor(status);

    return <Tag color={color}>{label}</Tag>;
}

export interface UserJobsProps {
    jobs: Array<Job>;
    searchState: SearchState;
    search: (searchExpression: JobsSearchExpression) => void;
    cancelJob: (jobID: string) => void;
}

interface UserJobsState {
    showDates: boolean;
    currentJobStatusFilter: Array<JobStatusFilterKey>;
    timeRange: TimeRange;
}

export default class UserJobs extends React.Component<UserJobsProps, UserJobsState> {
    currentQuery?: string;

    static defaultTimeRange: TimeRangePresets = 'lastWeek';

    constructor(props: UserJobsProps) {
        super(props);

        this.currentQuery = '';

        this.state = {
            showDates: false,
            currentJobStatusFilter: ['queued', 'running', 'canceled', 'success', 'error'],
            timeRange: { kind: 'preset', preset: UserJobs.defaultTimeRange }
        };
    }

    componentDidMount() {
        this.doSearch(true);
    }

    onChangeTimeRange(value: string) {
        // TODO: should narrow the string value
        if (value === 'customRange') {
            this.setState({
                showDates: true,
                timeRange: { kind: 'literal', start: Date.now(), end: Date.now() }
            });
            // nothing else to do.
            return;
        } else {
            this.setState(
                {
                    showDates: false,
                    timeRange: { kind: 'preset', preset: value as TimeRangePresets }
                },
                () => {
                    this.doSearch(true);
                }
            );
        }
    }

    onChangeQuery(event: React.ChangeEvent<HTMLInputElement>) {
        this.currentQuery = event.target.value;
    }

    onSubmit(event: React.FormEvent) {
        event.preventDefault();
        this.doSearch(true);
    }

    doSearch(forceSearch: boolean) {
        if (typeof this.currentQuery === 'undefined') {
            return;
        }

        const jobStatusFilter = jobStatusFilterOptionsToJobStatus(this.state.currentJobStatusFilter);

        const searchExpression: JobsSearchExpression = {
            query: this.currentQuery,
            timeRange: this.state.timeRange,
            jobStatus: jobStatusFilter,
            forceSearch
        };

        this.props.search(searchExpression);
        return false;
    }

    onRangeFromChange(date: Moment) {
        // handle logic of switching from 'preset' to 'literal'
        let existingTimeRange = this.state.timeRange;
        let timeRange: TimeRange;
        switch (existingTimeRange.kind) {
            case 'preset':
                timeRange = {
                    kind: 'literal',
                    start: date.valueOf(),
                    end: Infinity
                };
                break;
            case 'literal':
                timeRange = {
                    kind: 'literal',
                    start: date.valueOf(),
                    end: existingTimeRange.end
                };
                break;
            default:
                return;
        }

        this.setState({
            timeRange
        });
    }

    onRangeToChange(date: Moment) {
        let existingTimeRange = this.state.timeRange;
        let timeRange: TimeRange;
        switch (existingTimeRange.kind) {
            case 'preset':
                timeRange = {
                    kind: 'literal',
                    start: Infinity,
                    end: date.valueOf()
                };
                break;
            case 'literal':
                timeRange = {
                    kind: 'literal',
                    start: existingTimeRange.start,
                    end: date.valueOf()
                };
                break;
            default:
                return;
        }

        this.setState({
            timeRange
        });
    }

    renderJobAction(job: Job) {
        switch (job.status) {
            case JobStatus.QUEUED:
            case JobStatus.RUNNING:
                return (
                    <Popconfirm
                        title="Cancel this job?"
                        onConfirm={() => {
                            this.props.cancelJob(job.id);
                        }}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button icon="close" type="danger" />
                    </Popconfirm>
                );
            default:
                return;
        }
    }

    renderSearchInput() {
        let dateControls;
        if (this.state.showDates) {
            const timeRange = this.state.timeRange;
            if (timeRange.kind === 'literal') {
                dateControls = (
                    <React.Fragment>
                        <Form.Item label="From">
                            <DatePicker
                                showTime={true}
                                allowClear={false}
                                value={moment(timeRange.start)}
                                onChange={this.onRangeFromChange.bind(this)}
                            />
                        </Form.Item>
                        <Form.Item label="To">
                            <DatePicker
                                showTime={true}
                                allowClear={false}
                                value={moment(timeRange.end)}
                                onChange={this.onRangeToChange.bind(this)}
                            />
                        </Form.Item>
                    </React.Fragment>
                );
            }
        }
        return (
            <Form layout="inline" onSubmit={this.onSubmit.bind(this)}>
                <Form.Item>
                    <Input
                        defaultValue={this.currentQuery}
                        placeholder="Search jobs"
                        style={{ width: '15em' }}
                        onChange={this.onChangeQuery.bind(this)}
                    />
                </Form.Item>

                <Form.Item label="TimeRange" />
                <Form.Item>
                    <Select
                        defaultValue={UserJobs.defaultTimeRange}
                        onChange={this.onChangeTimeRange.bind(this)}
                        dropdownMatchSelectWidth={true}
                        style={{ width: '11em' }}
                    >
                        <Select.Option value="lastHour">Previous Hour</Select.Option>
                        <Select.Option value="last48Hours">Previous 48 Hours</Select.Option>
                        <Select.Option value="lastWeek">Previous Week</Select.Option>
                        <Select.Option value="lastMonth">Previous Month</Select.Option>
                        <Select.Option value="customRange">Custom Range</Select.Option>
                    </Select>
                </Form.Item>
                {dateControls}

                <Form.Item>
                    <Button icon="search" type="primary" htmlType="submit" />
                </Form.Item>

                <Form.Item>
                    <Monitor
                        onPoll={() => {
                            this.doSearch(true);
                        }}
                        startMonitoring={true}
                    />
                </Form.Item>
            </Form>
        );
    }

    onFilterChange(filters: Array<CheckboxValueType>) {
        const filter = filters as Array<JobStatusFilterKey>;

        this.setState(
            {
                currentJobStatusFilter: filter
            },
            () => {
                this.doSearch(false);
            }
        );
    }

    onChangeJobStatusAny(event: CheckboxChangeEvent) {
        if (event.target.checked) {
            this.setState(
                {
                    currentJobStatusFilter: ['queued', 'running', 'canceled', 'success', 'error']
                },
                () => {
                    this.doSearch(false);
                }
            );
        }
    }

    onClickAny() {
        this.setState(
            {
                currentJobStatusFilter: ['queued', 'running', 'canceled', 'success', 'error']
            },
            () => {
                this.doSearch(false);
            }
        );
    }

    onClickFinished() {
        this.setState(
            {
                currentJobStatusFilter: ['canceled', 'success', 'error']
            },
            () => {
                this.doSearch(false);
            }
        );
    }

    onClickActive() {
        this.setState(
            {
                currentJobStatusFilter: ['queued', 'running']
            },
            () => {
                this.doSearch(false);
            }
        );
    }

    renderFilterInput() {
        const options = jobStatusFilterOptions;
        return (
            <div>
                <div>
                    <span style={{ color: 'gray', fontWeight: 'bold', marginRight: '10px' }}>Filter by Job Status</span>
                    <Button size="small" onClick={this.onClickAny.bind(this)}>
                        <i>Any</i>
                    </Button>{' '}
                    <Button size="small" onClick={this.onClickActive.bind(this)}>
                        <i>Active</i>
                    </Button>{' '}
                    <Button size="small" onClick={this.onClickFinished.bind(this)} style={{ marginRight: '10px' }}>
                        <i>Finished</i>
                    </Button>
                    <Checkbox.Group
                        options={options}
                        onChange={this.onFilterChange.bind(this)}
                        value={this.state.currentJobStatusFilter}
                    />
                </div>
            </div>
        );
    }

    renderControlBar() {
        return (
            <div className="Col">
                <div className="Row">{this.renderSearchInput()}</div>
                <div className="Row" style={{ margin: '10px auto' }}>
                    {this.renderFilterInput()}
                </div>
            </div>
        );
    }

    render() {
        const loading = this.props.searchState === SearchState.SEARCHING;
        return (
            <div>
                <div>{this.renderControlBar()}</div>
                <div>
                    <Table
                        dataSource={this.props.jobs}
                        loading={loading}
                        rowKey={(job: Job) => {
                            return job.id;
                        }}
                        pagination={{ position: 'bottom', showSizeChanger: true }}
                        size="small"
                        className="UserJobs-table"
                        expandIcon={(props: ExpandIconProps<Job>) => {
                            let icon;
                            if (props.expanded) {
                                icon = <Icon type="folder-open" />;
                            } else {
                                icon = <Icon type="folder" />;
                            }
                            return (
                                <Button
                                    type="link"
                                    className="expand-row-icon"
                                    onClick={(e) => {
                                        return props.onExpand(props.record, (e as unknown) as MouseEvent);
                                    }}
                                >
                                    {icon}
                                </Button>
                            );
                        }}
                        expandedRowRender={(job: Job) => {
                            return <JobLog jobId={job.id} />;
                        }}
                    >
                        <Table.Column
                            title="User"
                            dataIndex="username"
                            key="username"
                            width="10%"
                            render={(username: string) => {
                                return (
                                    <a href={`#people/${username}`} target="_parent">
                                        {username}
                                    </a>
                                );
                            }}
                            sorter={(a: Job, b: Job) => {
                                return a.username.localeCompare(b.username);
                            }}
                        />
                        <Table.Column
                            title="Narrative"
                            dataIndex="narrativeTitle"
                            key="narrativeTitle"
                            width="17%"
                            // style={cellStyle}
                            render={(title: string, job: Job): any => {
                                if (!title || !job.narrativeID) {
                                    return 'n/a';
                                }
                                const href = ['/narrative', job.narrativeID].join('/');
                                return (
                                    <a href={href} target="_blank" rel="noopener noreferrer">
                                        {title}
                                    </a>
                                );
                            }}
                            sorter={(a: Job, b: Job) => {
                                if (!a.narrativeTitle) {
                                    if (!b.narrativeTitle) {
                                        return 0;
                                    }
                                    return -1;
                                } else {
                                    if (!b.narrativeTitle) {
                                        return 1;
                                    }
                                    return a.narrativeTitle.localeCompare(b.narrativeTitle);
                                }
                            }}
                        />
                        <Table.Column
                            title="App"
                            dataIndex="appTitle"
                            key="appTitle"
                            width="18%"
                            // style={cellStyle}
                            render={(title: string, job: Job): any => {
                                if (!title) {
                                    return 'n/a';
                                }
                                const href = '/#catalog/apps/' + job.appID;
                                return (
                                    <Tooltip title={title}>
                                        <a href={href} target="_parent">
                                            {title}
                                        </a>
                                    </Tooltip>
                                );
                            }}
                            sorter={(a: Job, b: Job) => {
                                if (!a.appTitle) {
                                    if (!b.appTitle) {
                                        return 0;
                                    }
                                    return -1;
                                } else {
                                    if (!b.appTitle) {
                                        return 1;
                                    }
                                    return a.appTitle.localeCompare(b.appTitle);
                                }
                            }}
                        />
                        <Table.Column
                            title="Submitted"
                            dataIndex="queuedAt"
                            key="queuedAt"
                            width="8%"
                            render={(date: number, job: Job) => {
                                if (!date) {
                                    return <span>** empty **</span>;
                                }
                                return <NiceRelativeTime time={new Date(date)} />;
                            }}
                            defaultSortOrder="descend"
                            sorter={(a: Job, b: Job) => {
                                if (a.queuedAt === null) {
                                    if (b.queuedAt === null) {
                                        return 0;
                                    }
                                    return -1;
                                } else {
                                    if (b.queuedAt === null) {
                                        return 1;
                                    }
                                    return a.queuedAt - b.queuedAt;
                                }
                            }}
                        />
                        <Table.Column
                            title="Queued for"
                            dataIndex="queuedElapsed"
                            key="queuedElapsed"
                            width="8%"
                            render={(duration: number) => {
                                return <NiceTimeDuration duration={duration} precision={2} />;
                            }}
                            sorter={(a: Job, b: Job) => {
                                if (a.queuedElapsed === null) {
                                    if (b.queuedElapsed === null) {
                                        return 0;
                                    }
                                    return -1;
                                } else {
                                    if (b.queuedElapsed === null) {
                                        return 1;
                                    }
                                    return a.queuedElapsed - b.queuedElapsed;
                                }
                            }}
                        />
                        <Table.Column
                            title="Run for"
                            dataIndex="runElapsed"
                            key="runElapsed"
                            width="8%"
                            render={(duration: number | null) => {
                                if (duration === null) {
                                    return '-';
                                }
                                return <NiceTimeDuration duration={duration} precision={2} />;
                            }}
                            sorter={(a: Job, b: Job) => {
                                if (a.runElapsed === null) {
                                    if (b.runElapsed === null) {
                                        return 0;
                                    }
                                    return -1;
                                } else {
                                    if (b.runElapsed === null) {
                                        return 1;
                                    }
                                    return a.runElapsed - b.runElapsed;
                                }
                            }}
                        />
                        <Table.Column
                            title="Status"
                            dataIndex="status"
                            key="status"
                            width="8%"
                            render={(status: JobStatus) => {
                                return renderJobStatus(status);
                            }}
                            sorter={(a: Job, b: Job) => {
                                if (a.status === b.status) {
                                    return 0;
                                }
                                if (a.status === JobStatus.QUEUED) {
                                    return -1;
                                }
                                if (a.status === JobStatus.RUNNING) {
                                    if (b.status === JobStatus.QUEUED) {
                                        return 1;
                                    }
                                    return -1;
                                }
                                if (a.status === JobStatus.FINISHED) {
                                    if (b.status === JobStatus.QUEUED || b.status === JobStatus.RUNNING) {
                                        return 1;
                                    }
                                    return -1;
                                }
                                if (a.status === JobStatus.ERRORED) {
                                    if (b.status === JobStatus.CANCELED) {
                                        return -1;
                                    }
                                    return 1;
                                }
                                return 1;
                            }}
                        />
                        <Table.Column
                            title="Server Type"
                            dataIndex="clientGroups"
                            key="clientGroups"
                            width="8%"
                            render={(clientGroups: Array<string>) => {
                                return clientGroups.join(',');
                            }}
                            sorter={(a: Job, b: Job) => {
                                // TODO: sort client groups first...
                                return a.clientGroups.join(',').localeCompare(b.clientGroups.join(','));
                            }}
                        />
                        <Table.Column
                            title="Cancel"
                            dataIndex="action"
                            key="action"
                            width="5%"
                            render={(status: JobStatus, job: Job) => {
                                return this.renderJobAction(job);
                            }}
                        />
                    </Table>
                </div>
            </div>
        );
    }
}
