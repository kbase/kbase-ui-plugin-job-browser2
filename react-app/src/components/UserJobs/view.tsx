/**
 * A component for browsing through (search, filter, sort) jobs submitted by
 * the current user.
 */

// 3rd party imports
import React from 'react';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import {
    Table, Form, Input, Button, Checkbox, Select, DatePicker,
    Popconfirm, Tooltip, Modal, Switch
} from 'antd';
import moment, { Moment } from 'moment';
import JobStatusBadge from '../JobStatus';

// project imports (should be shared lib)
import { NiceRelativeTime, NiceElapsedTime } from '@kbase/ui-components';

// project imports
import {
    Job, JobStatus, JobsSearchExpression, SearchState, TimeRange,
    TimeRangePresets, TimeRangeLiteral, SortSpec
} from '../../redux/store';
import JobDetail from '../JobDetail';

// file imports
import './style.css';
import Monitor from '../Monitor';
import PubSub from '../../lib/PubSub';
import UILink from '../UILink';
import NarrativeLink from '../NarrativeLink';

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
                jobStatuses.push(JobStatus.CANCELED_QUEUED);
                jobStatuses.push(JobStatus.CANCELED_RUNNING);
                break;
            case 'success':
                jobStatuses.push(JobStatus.FINISHED);
                break;
            case 'error':
                jobStatuses.push(JobStatus.ERRORED_QUEUED);
                jobStatuses.push(JobStatus.ERRORED_RUNNING);
                break;
        }
    });
    return jobStatuses;
}

export interface UserJobsProps {
    jobs: Array<Job>;
    searchState: SearchState;
    showMonitoringControls: boolean;
    search: (searchExpression: JobsSearchExpression) => void;
    cancelJob: (jobID: string) => void;
}

interface UserJobsState {
    showDates: boolean;
    currentJobStatusFilter: Array<JobStatusFilterKey>;
    timeRange: TimeRange;
    isFilterOpen: boolean;
    selectedJob: Job | null;
    currentSort: SortSpec | null;
}

export default class UserJobs extends React.Component<UserJobsProps, UserJobsState> {
    currentQuery?: string;

    static defaultTimeRange: TimeRangePresets = 'last48Hours';
    pubsub: PubSub;

    constructor(props: UserJobsProps) {
        super(props);

        this.currentQuery = '';
        this.pubsub = new PubSub();

        this.state = {
            showDates: false,
            currentJobStatusFilter: ['queued', 'running', 'canceled', 'success', 'error'],
            timeRange: { kind: 'preset', preset: UserJobs.defaultTimeRange },
            isFilterOpen: false,
            selectedJob: null,
            currentSort: null
        };
    }

    componentDidMount() {
        this.doSearch(true);
    }

    componentDidUpdate() {
        if (this.props.searchState === SearchState.SEARCHING) {
            this.pubsub.send('searching', { is: true });
        } else {
            this.pubsub.send('searching', { is: false });
        }
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
            forceSearch,
            sort: this.state.currentSort
        };

        this.pubsub.send('search', {});

        this.props.search(searchExpression);
        return false;
    }

    onRangeFromChange(date: Moment | null, dateString: string) {
        // TODO: if the range ends up null (how?), should it default
        // to the previously selected preset? For now, just go back to lastHourl.
        if (date === null) {
            this.setState({
                timeRange: {
                    kind: 'preset',
                    preset: 'lastHour'
                }
            });
            return;
        }

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

    onRangeToChange(date: Moment | null, dateString: string) {
        // TODO: if the range ends up null (how?), should it default
        // to the previously selected preset? For now, just go back to lastHourl.
        if (date === null) {
            this.setState({
                timeRange: {
                    kind: 'preset',
                    preset: 'lastHour'
                }
            });
            return;
        }
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
                        <Button icon="close" type="danger" size="small" />
                    </Popconfirm>
                );
            default:
                return;
        }
    }

    renderTimeRangeSelectionControl() {
        return <Select
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
        </Select>;
    }

    renderTimeRangeControl(timeRange: TimeRangeLiteral) {
        return <React.Fragment>
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
        </React.Fragment>;
    }

    renderSearchInput() {
        let dateControls;
        if (this.state.showDates) {
            const timeRange = this.state.timeRange;
            if (timeRange.kind === 'literal') {
                dateControls = this.renderTimeRangeControl(timeRange);
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
                    {this.renderTimeRangeSelectionControl()}
                </Form.Item>

                {dateControls}

                <Form.Item>
                    <Button icon="search" type="primary" htmlType="submit" />
                </Form.Item>

                <Form.Item>
                    <Switch checkedChildren="hide filters" unCheckedChildren="show filters" onChange={this.onToggleFilterArea.bind(this)} />
                </Form.Item>

                <Form.Item>
                    <Monitor
                        onPoll={() => {
                            this.doSearch(true);
                        }}
                        pubsub={this.pubsub}
                        startPolling={true}
                        isPollerRunning={this.props.searchState === SearchState.SEARCHING}
                        showControls={this.props.showMonitoringControls}
                        startOpen={true}
                    />
                </Form.Item>
            </Form>
        );
    }

    onToggleFilterArea(isFilterOpen: boolean) {
        this.setState({ isFilterOpen });
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
            <div className="UserJobs-filterArea">
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
        );
    }

    renderControlBar() {
        let filterRowStyle: React.CSSProperties = { margin: '10px 10px 10px 0' };
        if (!this.state.isFilterOpen) {
            filterRowStyle.display = 'none';
        }
        let filterRow;
        if (this.state.isFilterOpen) {
            filterRow = <div className="Row" style={filterRowStyle}>
                {this.renderFilterInput()}
            </div>;
        }
        return (
            <div className="Col">
                <div className="Row">{this.renderSearchInput()}</div>
                {filterRow}
            </div>
        );
    }

    onClickDetail(job: Job) {
        this.setState({
            selectedJob: job
        });
    }

    onCloseModal() {
        this.setState({
            selectedJob: null
        });
    }

    renderJobDetail() {
        if (!this.state.selectedJob) {
            return;
        }
        const footer = (
            <Button key="cancel" onClick={this.onCloseModal.bind(this)}>
                Close
            </Button>
        );
        const title = (
            <span>
                Detail for Job <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{this.state.selectedJob.id}</span>
            </span>
        );
        return (
            <Modal className="FullScreenModal" title={title}
                onCancel={this.onCloseModal.bind(this)} visible={true}
                footer={footer}>
                <JobDetail jobID={this.state.selectedJob.id} />
            </Modal>
        );
    }

    renderJobsTable() {
        const loading = this.props.searchState === SearchState.SEARCHING;
        return (
            <Table
                size="small"
                className="UserJobs-table xScrollingFlexTable"
                dataSource={this.props.jobs}
                loading={loading}
                rowKey={(job: Job) => {
                    return job.id;
                }}
                pagination={{ position: 'bottom', showSizeChanger: true }}
            // onChange={this.onTableChanged.bind(this)}
            // pagination={false}
            // scroll={{ y: '100%' }}

            >
                <Table.Column
                    title="ID"
                    dataIndex="id"
                    key="id"
                    width="8%"
                    render={(jobID: string, job: Job): any => {
                        const title = jobID;
                        return (
                            <Tooltip title={title}>
                                <a href="https://example.com" onClick={(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
                                    e.preventDefault();
                                    this.onClickDetail(job);
                                }}>{jobID}</a>
                            </Tooltip>
                        );
                    }}
                />
                <Table.Column
                    title="User"
                    dataIndex="username"
                    key="username"
                    width="10%"
                    render={(username: string) => {
                        return (
                            <UILink path={`people/${username}`}
                                openIn='new-tab'>
                                {username}
                            </UILink>
                        );
                    }}
                />
                <Table.Column
                    title="Narrative"
                    dataIndex="narrativeTitle"
                    key="narrativeTitle"
                    width="17%"
                    render={(title: string, job: Job): any => {
                        if (!title || !job.narrativeID) {
                            return 'n/a';
                        }
                        return (
                            <Tooltip title={title}>
                                <NarrativeLink narrativeID={job.narrativeID}>
                                    {title}
                                </NarrativeLink>
                            </Tooltip>
                        );
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
                        return (
                            <Tooltip title={title}>
                                <UILink path={`catalog/apps/${job.appID}`}
                                    openIn='same-window'>
                                    {title}
                                </UILink>
                            </Tooltip>
                        );
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
                    title="Queued"
                    dataIndex="queuedElapsed"
                    key="queuedElapsed"
                    width="10%"
                    render={(_, job: Job) => {
                        switch (job.status) {
                            case JobStatus.QUEUED:
                                return <NiceElapsedTime from={job.queuedAt} precision={2} useClock={true} />;
                            case JobStatus.ERRORED_QUEUED:
                            case JobStatus.CANCELED_QUEUED:
                                return <NiceElapsedTime from={job.queuedAt} to={job.finishAt} precision={2} />;
                            default:
                                return <NiceElapsedTime from={job.queuedAt} to={job.runAt} precision={2} />;
                        }
                    }}
                />
                <Table.Column
                    title="Run"
                    // dataIndex="runElapsed"
                    key="runElapsed"
                    width="10%"
                    render={(_, job: Job) => {
                        switch (job.status) {
                            case JobStatus.QUEUED:
                            case JobStatus.ERRORED_QUEUED:
                            case JobStatus.CANCELED_QUEUED:
                                return '-';
                            case JobStatus.RUNNING:
                                return <NiceElapsedTime from={job.runAt} precision={2} useClock={true} />;
                            case JobStatus.FINISHED:
                            case JobStatus.CANCELED_RUNNING:
                            case JobStatus.ERRORED_RUNNING:
                                return <NiceElapsedTime from={job.runAt} to={job.finishAt} precision={2} />;
                        }
                    }}
                />
                <Table.Column
                    title="Status"
                    dataIndex="status"
                    key="status"
                    width="8%"
                    render={(status: JobStatus, job: Job) => {
                        return <JobStatusBadge job={job} />;
                    }}
                />
                <Table.Column
                    title="Server"
                    dataIndex="clientGroups"
                    key="clientGroups"
                    width="8%"
                    render={(clientGroups: Array<string>) => {
                        return clientGroups.join(',');
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
        );
    }

    render() {
        return (
            <div data-k-b-testhook-component="UserJobs" className="UserJobs">
                <div>{this.renderControlBar()}</div>
                {this.renderJobsTable()}
                {this.renderJobDetail()}
            </div>
        );
    }
}
