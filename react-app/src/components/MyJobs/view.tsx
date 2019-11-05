/**
 * A component for browsing through (search, filter, sort) jobs submitted by
 * the current user.
 */

/** imports */
// 3rd party imports
import React from 'react';
import { Table, Form, Input, Button, Checkbox, Select, DatePicker, Popconfirm, Tooltip, Modal, Switch } from 'antd';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import moment, { Moment } from 'moment';

// project imports
import { Job, JobStatus, JobsSearchExpression, SearchState, TimeRangePresets, TimeRange, SortSpec } from '../../redux/store';

// kbase imports (or should be kbase imports)
import { NiceRelativeTime, NiceElapsedTime } from '@kbase/ui-components';
import JobStatusBadge from '../JobStatus'

// project imoprts
import JobDetail from '../JobDetail';

// file imports
import './style.css';
import Monitor from '../Monitor';
import PubSub from '../../lib/PubSub';
import { PaginationConfig, SortOrder } from 'antd/lib/table';

/**
 * This version of the job status defines the set of strings that may be used
 * in the ui controls.
 *
 */
type JobStatusFilterKey = 'queued' | 'running' | 'canceled' | 'success' | 'error';

/**
 * This interface describes a single option for the available job status filter options.
 *
 * Job status filter options are used to populate the checkboxgroup.
 * Note that the value of each option is a job status filter key.
 */
interface JobStatusFilterOption {
    label: string;
    value: JobStatusFilterKey;
}

/**
 * A set of job status filter options used to populate and control a set of checkboxes provided
 * for the user to be able to filter jobs according to their job status.
 *
 * Note that this is a set of options because the antd checkboxgroup simplifies a set of checkboxes
 * through sets of options.
 */
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

/**
 * Translates an array of job status filter keys, as provided by the ui job status
 * filter checkboxes, to an array of job statuses suitable for passing to the job
 * status search.
 *
 * @param filter - an array of job status filter keys
 *
 * @note Since the switch is over an enum, we don't have to worry about the default case
 *
 * @returns an array of job statuses
 */
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

/**
 * Semantic aliasing of for epoch time in milliseconds, as produced
 * by Date.now(), new Date().getTime(), etc.
 *
 * @todo move to a common location
 */
type EpochTime = number;

/**
 * Props for the MyJobs component
 */
export interface MyJobsProps {
    /** The list of jobs to display */
    jobs: Array<Job>;
    /** The current search state, used to control the primary display (none, searching, searched, error) */
    searchState: SearchState;
    showMonitoringControls: boolean
    /** Triggers a redux action to search of the user's jobs according to the given search expression
     * @remarks Since at present the service used to fetch the jobs can suffer performance issues, the
     * default search action does not fetch search results each time (rather ??).
     * @todo when job search is more performant, this function may be removed and redirected to the
     * search function.
     */
    search: (searchExpression: JobsSearchExpression) => void;
    /** Triggers a redux action to cancel the indicated job */
    cancelJob: (jobID: string) => void;
}

/**
 * State for the MyJobs component
 */
interface MyJobsState {
    /** Flag to show the date controls */
    showDates: boolean;
    /** Contains the current selection of job statuses in the checkbox control */
    currentJobStatusFilter: Array<JobStatusFilterKey>;
    /** Contains the initial timestamp (ms epoch time) for time range */
    timeRange: TimeRange;

    isFilterOpen: boolean;

    selectedJob: Job | null;
    currentSort: SortSpec | null;
}

/**
 * A View Component for browsing through the current user's jobs.
 *
 * @remarks
 * This component is really just a tabular view into a user's jobs. It provides
 * support for free text searching, filtering by job state, and date ranges.
 *
 */
export default class MyJobs extends React.Component<MyJobsProps, MyJobsState> {
    currentQuery?: string;

    static defaultTimeRangePreset: TimeRangePresets = 'lastWeek';

    pubsub: PubSub;

    constructor(props: MyJobsProps) {
        super(props);

        this.currentQuery = '';
        this.pubsub = new PubSub();

        this.state = {
            showDates: false,
            currentJobStatusFilter: ['queued', 'running', 'canceled', 'success', 'error'],
            timeRange: { kind: 'preset', preset: MyJobs.defaultTimeRangePreset },
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
            this.pubsub.send('searching', { is: true })
        } else {
            this.pubsub.send('searching', { is: false })
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

    // onTableChanged(pagination: PaginationConfig, filters: any, sorter: any) {
    //     console.log('table changed', pagination, filters, sorter);
    //     this.setState(
    //         {
    //             currentSort: {
    //                 field: sorter.field,
    //                 direction: sorter.order === 'ascend' ? 'ascending' : 'descending'
    //             }
    //         },
    //         () => {
    //             this.doSearch(false);
    //         }
    //     );
    // }

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
            sort: null
            // sort: this.state.currentSort
        };

        // TODO: document wth is happening here.
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
                        defaultValue={MyJobs.defaultTimeRangePreset}
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
                    <Switch checkedChildren="hide filters" unCheckedChildren="show filters" onChange={this.onToggleFilterArea.bind(this)} />
                </Form.Item>

                <Form.Item>
                    <Monitor
                        onPoll={() => {
                            this.doSearch(true);
                        }}
                        pubsub={this.pubsub}
                        isPollerRunning={this.props.searchState === SearchState.SEARCHING}
                        startPolling={false}
                        showControls={this.props.showMonitoringControls}
                        startOpen={false}
                    />
                </Form.Item>
            </Form>
        );
    }

    onToggleFilterArea(isFilterOpen: boolean) {
        this.setState({ isFilterOpen })
        // this.setState({ isFilterOpen: !this.state.isFilterOpen });
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
            <div className="MyJobs-filterArea">
                <span style={{ color: 'gray', fontWeight: 'bold', marginRight: '10px' }}>Filter by Job Status</span>
                <Button size="small" type="link" onClick={this.onClickAny.bind(this)} data-k-b-testhook-button="any">
                    <i>Any</i>
                </Button>{' '}
                <Button size="small" type="link" onClick={this.onClickActive.bind(this)} data-k-b-testhook-button="active">
                    <i>Active</i>
                </Button>{' '}
                <Button
                    size="small" type="link"
                    onClick={this.onClickFinished.bind(this)}
                    style={{ marginRight: '10px' }}
                    data-k-b-testhook-button="finished"
                >
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
            </div>
        }
        return (
            <div className="Col">
                <div className="Row">{this.renderSearchInput()}</div>
                {filterRow}
            </div>
        );
    }

    onJobCancel(job: Job) {
        this.props.cancelJob(job.id);
    }

    renderJobAction(job: Job) {
        switch (job.status) {
            case JobStatus.QUEUED:
            case JobStatus.RUNNING:
                return (
                    <Popconfirm
                        title="Cancel this job?"
                        onConfirm={() => {
                            this.onJobCancel(job);
                        }}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            icon="close"
                            type="danger"
                            size="small"
                            data-k-b-testhook-button="cancel"
                        />
                    </Popconfirm>
                );
            default:
                return;
        }
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

    renderJobsTable() {
        const loading = this.props.searchState === SearchState.SEARCHING;
        return (
            <Table
                size="small"
                className="MyJobs-table xScrollingFlexTable"
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
                    width="10%"
                    render={(jobID: string, job: Job): any => {
                        const title = jobID;
                        return (
                            <Tooltip title={title}>
                                <a href="https://example.com" onClick={(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
                                    e.preventDefault();
                                    this.onClickDetail(job)
                                }}>{jobID}</a>
                            </Tooltip>
                        )
                    }}
                // sorter={(a: Job, b: Job) => {
                //     return a.id.localeCompare(b.id);
                // }}
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
                                <a
                                    href={`/narrative/${job.narrativeID}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {title}
                                </a>
                            </Tooltip>
                        );
                    }}
                // sorter={(a: Job, b: Job) => {
                //     return a.narrativeTitle.localeCompare(b.narrativeTitle);
                // }}
                />
                <Table.Column
                    title="App"
                    dataIndex="appTitle"
                    key="appTitle"
                    width="20%"
                    render={(title: string, job: Job): any => {
                        if (!title) {
                            return 'n/a';
                        }
                        const href = '/#catalog/apps/' + job.appID;
                        return (
                            <Tooltip title={title}>
                                <a href={href}>{title}</a>
                            </Tooltip>
                        );
                    }}
                // sorter={(a: Job, b: Job) => {
                //     return a.appTitle.localeCompare(b.appTitle);
                // }}
                />
                <Table.Column
                    title="Submitted"
                    dataIndex="queuedAt"
                    key="queuedAt"
                    width="10%"
                    render={(date: number, job: Job) => {
                        if (!date) {
                            return <span>** empty **</span>;
                        }
                        return <NiceRelativeTime time={new Date(date)} />;
                    }}
                    defaultSortOrder="descend"
                    // sorter={true}
                    sorter={(a: Job, b: Job, sortOrder?: SortOrder) => {
                        let direction: number;
                        if (sortOrder === 'ascend') {
                            direction = -1;
                        } else {
                            direction = 1;
                        }
                        if (a.queuedAt === null) {
                            if (b.queuedAt === null) {
                                return 0;
                            }
                            return -1 * direction;
                        } else {
                            if (b.queuedAt === null) {
                                return 1 * direction;
                            }
                            return (a.queuedAt - b.queuedAt) * direction;
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
                            case JobStatus.ERRORED_QUEUED:
                            case JobStatus.CANCELED_QUEUED:
                                return <NiceElapsedTime from={job.queuedAt} precision={2} useClock={true} />;
                            default:
                                return <span>-</span>;
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
                    width="10%"
                    render={(status: JobStatus, job: Job) => {
                        return <JobStatusBadge job={job} />;
                    }}
                // sorter={(a: Job, b: Job) => {
                //     if (a.status === b.status) {
                //         return 0;
                //     }
                //     if (a.status === JobStatus.QUEUED) {
                //         return -1;
                //     }
                //     if (a.status === JobStatus.RUNNING) {
                //         if (b.status === JobStatus.QUEUED) {
                //             return 1;
                //         }
                //         return -1;
                //     }
                //     if (a.status === JobStatus.FINISHED) {
                //         if (b.status === JobStatus.QUEUED || b.status === JobStatus.RUNNING) {
                //             return 1;
                //         }
                //         return -1;
                //     }
                //     if (a.status === JobStatus.ERRORED) {
                //         if (b.status === JobStatus.CANCELED_QUEUED || b.status === JobStatus.CANCELED_RUNNING) {
                //             return -1;
                //         }
                //         return 1;
                //     }
                //     return 1;
                // }}
                />
                <Table.Column
                    title="Server"
                    dataIndex="clientGroups"
                    key="clientGroups"
                    width="8%"
                    render={(clientGroups: Array<string>) => {
                        return clientGroups.join(',');
                    }}
                // sorter={(a: Job, b: Job) => {
                //     // TODO: sort client groups first...
                //     return a.clientGroups.join(',').localeCompare(b.clientGroups.join(','));
                // }}
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
        )
    }

    renderJobDetail() {
        if (!this.state.selectedJob) {
            return;
        }
        const footer = (
            <Button key="cancel" onClick={this.onCloseModal.bind(this)}>
                Close
            </Button>
        )
        const title = (
            <span>
                Detail for Job <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{this.state.selectedJob.id}</span>
            </span>
        )
        return (
            <Modal className="FullScreenModal" title={title}
                onCancel={this.onCloseModal.bind(this)} visible={true}
                footer={footer}>
                <JobDetail jobID={this.state.selectedJob.id} />
            </Modal>
        )
    }

    render() {
        return (
            <div data-k-b-testhook-component="MyJobs" className="MyJobs">
                <div>{this.renderControlBar()}</div>
                {this.renderJobsTable()}
                {this.renderJobDetail()}
            </div>
        );
    }
}
