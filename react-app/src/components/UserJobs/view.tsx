/**
 * A component for browsing through (search, filter, sort) jobs submitted by
 * the current user.
 */

/** imports */
// 3rd party imports
import React from 'react';
import {
    Table, Form, Input, Button, Checkbox, Select, DatePicker, Popconfirm, Tooltip,
    Modal, Switch, Spin, Alert
} from 'antd';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import moment, { Moment } from 'moment';

// project imports
import {
    Job, JobsSearchExpression, TimeRangePresets,
    TimeRange, SortSpec, JobContextType, JobSearchStatus, UserJobsViewData, JobSearchState, UserJobsViewDataReady, UserJobsViewDataSearching, UserJobsViewDataError, UserJobsViewDataInitialSearching
} from '../../redux/store';
import JobDetail from '../JobDetail';

// kbase imports (or should be kbase imports)
import { NiceRelativeTime, NiceElapsedTime } from '@kbase/ui-components';
import JobStatusBadge from '../JobStatusBadge';

// file imports
import './style.css';
import Monitor from '../Monitor';
import PubSub from '../../lib/PubSub';
import { JobEvent, JobStateType } from '../../redux/types/jobState';
import { PaginationConfig } from 'antd/lib/table';
import UILink from '../UILink';
import NarrativeLink from '../NarrativeLink';


const CANCEL_TIMEOUT = 10000;

/**
 * This version of the job status defines the set of strings that may be used
 * in the ui controls.
 *
 */
// type JobStatusFilterKey = 'queued' | 'running' | 'canceled' | 'success' | 'error';

/**
 * This interface describes a single option for the available job status filter options.
 *
 * Job status filter options are used to populate the checkboxgroup.
 * Note that the value of each option is a job status filter key.
 */
interface JobStatusFilterOption {
    label: string;
    value: JobSearchStatus;
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
        value: 'queue'
    },
    {
        label: 'Running',
        value: 'run'
    },
    {
        label: 'Completed',
        value: 'complete'
    },
    {
        label: 'Error',
        value: 'error'
    },
    {
        label: 'Canceled',
        value: 'terminate'
    }
];

/**
 * Semantic aliasing of for epoch time in milliseconds, as produced
 * by Date.now(), new Date().getTime(), etc.
 *
 * @todo move to a common location
 */
type EpochTime = number;

/**
 * Props for the UserJobs component
 */
export interface UserJobsProps {
    view: UserJobsViewData;
    /** The list of jobs to display */
    // jobs: Array<Job>;
    // /** The current search state, used to control the primary display (none, searching, searched, error) */
    // searchState: SearchState;
    // showMonitoringControls: boolean
    /** Triggers a redux action to search of the user's jobs according to the given search expression
     * @remarks Since at present the service used to fetch the jobs can suffer performance issues, the
     * default search action does not fetch search results each time (rather ??).
     * @todo when job search is more performant, this function may be removed and redirected to the
     * search function.
     */
    search: (searchExpression: JobsSearchExpression) => void;
    /** Triggers a redux action to cancel the indicated job */
    cancelJob: (jobID: string, timeout: number) => void;
}

/**
 * State for the UserJobs component
 */
interface UserJobsState {
    /** Flag to show the date controls */
    showDates: boolean;
    /** Contains the current selection of job statuses in the checkbox control */
    currentJobStatusFilter: Array<JobSearchStatus>;
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
export default class UserJobs extends React.Component<UserJobsProps, UserJobsState> {
    currentQuery?: string;
    offset: number;
    limit: number;
    sorting: SortSpec;

    static defaultTimeRangePreset: TimeRangePresets = 'lastWeek';

    pubsub: PubSub;

    constructor(props: UserJobsProps) {
        super(props);

        this.currentQuery = '';
        this.pubsub = new PubSub();
        this.offset = 0;
        this.limit = 10;
        this.sorting = {
            field: 'created',
            direction: 'descending'
        };

        this.state = {
            showDates: false,
            currentJobStatusFilter: ['queue', 'run', 'terminate', 'complete', 'error'],
            timeRange: { kind: 'preset', preset: UserJobs.defaultTimeRangePreset },
            isFilterOpen: false,
            selectedJob: null,
            currentSort: null
        };
    }

    currentJobState(job: Job): JobEvent {
        return job.eventHistory[job.eventHistory.length - 1];
    }

    firstState(job: Job): JobEvent {
        return job.eventHistory[0];
    }

    lastEventLike(job: Job, type: JobStateType): [JobEvent | null, JobEvent | null] {
        for (let i = job.eventHistory.length - 1; i >= 0; i -= 1) {
            const jobEvent = job.eventHistory[i];
            if (jobEvent.type === type) {
                const nextEvent = this.eventAt(job, i + 1);
                return [jobEvent, nextEvent];
            }
        }
        // TODO: a better way of ensuring we have the right sequence of events (as defined in types)
        return [null, null];
    }

    eventAt(job: Job, index: number): JobEvent | null {
        if (index > job.eventHistory.length - 1) {
            return null;
        }
        return job.eventHistory[index];
    }

    componentDidMount() {
        this.doSearch(true);
    }

    componentDidUpdate() {
        if (this.props.view.searchState === JobSearchState.SEARCHING) {
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

    onTableChanged(pagination: PaginationConfig, filters: any, sorter: any) {
        // if (typeof pagination.current !== 'undefined') {
        //     this.offset = pagination.current;
        // }

        // if (typeof pagination.pageSize !== 'undefined') {
        //     this.limit = pagination.pageSize;
        // }

        const currentPage = (pagination.current || 1) - 1;
        const currentPageSize = pagination.pageSize || 10;

        this.offset = currentPage * currentPageSize;
        this.limit = currentPageSize;

        // Calculate the sort spec 
        // Only create at sort order is supported.
        switch (sorter.columnKey) {
            case 'createAt':
                switch (sorter.order) {
                    case 'ascend':
                        this.sorting = {
                            field: 'created',
                            direction: 'ascending'
                        };
                        break;
                    case 'descend':
                    default:
                        this.sorting = {
                            field: 'created',
                            direction: 'descending'
                        };
                }
                break;
            default:
                this.sorting = {
                    field: 'created',
                    direction: 'descending'
                };
        }

        this.doSearch(false);
    }

    doSearch(forceSearch: boolean) {
        if (typeof this.currentQuery === 'undefined') {
            return;
        }

        const searchExpression: JobsSearchExpression = {
            query: this.currentQuery,
            timeRange: this.state.timeRange,
            jobStatus: this.state.currentJobStatusFilter,
            forceSearch,
            sort: this.sorting,
            offset: this.offset,
            limit: this.limit
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
                        defaultValue={UserJobs.defaultTimeRangePreset}
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
                        defaultRunning={false}
                    />
                </Form.Item>
            </Form>
        );
    }

    onToggleFilterArea(isFilterOpen: boolean) {
        this.setState({ isFilterOpen });
        // this.setState({ isFilterOpen: !this.state.isFilterOpen });
    }

    onFilterChange(filters: Array<CheckboxValueType>) {
        const filter = filters as Array<JobSearchStatus>;
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
                    currentJobStatusFilter: ['queue', 'run', 'terminate', 'complete', 'error']
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
                currentJobStatusFilter: ['queue', 'run', 'terminate', 'complete', 'error']
            },
            () => {
                this.doSearch(false);
            }
        );
    }

    onClickFinished() {
        this.setState(
            {
                currentJobStatusFilter: ['terminate', 'complete', 'error']
            },
            () => {
                this.doSearch(false);
            }
        );
    }

    onClickActive() {
        this.setState(
            {
                currentJobStatusFilter: ['queue', 'run']
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
            </div>;
        }
        return (
            <div className="Col">
                <div className="Row">{this.renderSearchInput()}</div>
                {filterRow}
            </div>
        );
    }

    onJobCancel(job: Job) {
        this.props.cancelJob(job.id, CANCEL_TIMEOUT);
    }

    renderJobAction(job: Job) {
        if ([JobStateType.CREATE, JobStateType.QUEUE, JobStateType.RUN].includes(this.currentJobState(job).type)) {
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

    renderJobsTable(view: UserJobsViewDataReady | UserJobsViewDataSearching) {
        const loading = this.props.view.searchState === JobSearchState.SEARCHING;
        return (
            <Table<Job>
                size="small"
                className="UserJobs-table xScrollingFlexTable"
                dataSource={view.searchResult.jobs}
                loading={loading}
                rowKey={(job: Job) => {
                    return job.id;
                }}
                pagination={{
                    position: 'bottom',
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    defaultPageSize: 10,
                    total: view.searchResult.foundCount,
                    showTotal: (total: number, [from, to]: [number, number]) => {
                        return <span>
                            {from} to {to} of {total}
                        </span>;
                    }
                }}
                onChange={this.onTableChanged.bind(this)}
            // pagination={false}
            // scroll={{ y: '100%' }}

            >
                <Table.Column
                    title="Job"
                    dataIndex="id"
                    key="id"
                    width="5%"
                    render={(jobID: string, job: Job): any => {
                        const title = <div>
                            <p><span style={{ color: 'silver' }}>Job ID</span>{' '}{jobID}</p>
                            <p>Click to view job log and detail</p>
                        </div>;
                        return (
                            <Tooltip title={title}>
                                <Button
                                    type="link"
                                    onClick={(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
                                        e.preventDefault();
                                        this.onClickDetail(job);
                                    }}
                                    icon="info-circle"
                                />
                            </Tooltip>
                        );
                    }}
                />
                <Table.Column
                    title="User"
                    // dataIndex="username"
                    key="username"
                    width="10%"
                    render={(_, job: Job) => {
                        return (
                            <UILink path={`people/${job.request.owner.username}`}
                                openIn='new-tab'>
                                {job.request.owner.realname}
                            </UILink>
                        );
                    }}
                />
                <Table.Column
                    title="Narrative"
                    key="narrativeTitle"
                    width="17%"
                    render={(_: any, job: Job): any => {
                        switch (job.request.context.type) {
                            case JobContextType.NARRATIVE:
                                const title = job.request.context.title;
                                return (
                                    <Tooltip title={title}>
                                        <NarrativeLink narrativeID={job.request.context.workspace.id}>
                                            {title}
                                        </NarrativeLink>
                                    </Tooltip>
                                );
                            case JobContextType.WORKSPACE:
                                if (job.request.context.workspace.isAccessible) {
                                    return job.request.context.workspace.name;
                                } else {
                                    return 'inaccessible workspace';
                                }
                            case JobContextType.EXPORT:
                                return 'export job';
                            case JobContextType.UNKNOWN:
                                return 'subjob';
                        }
                    }}
                />
                <Table.Column
                    title="App"
                    key="appTitle"
                    width="18%"
                    render={(_, job: Job): any => {
                        if (job.request.app === null) {
                            return 'n/a';
                        }
                        const appTitle = job.request.app.title;
                        if (!appTitle) {
                            return 'n/a';
                        }
                        return (
                            <Tooltip title={appTitle}>
                                <UILink path={`catalog/apps/${job.request.app.id}`}
                                    openIn='new-tab'>
                                    {appTitle}
                                </UILink>
                            </Tooltip>
                        );
                    }}
                />
                <Table.Column
                    title="Submitted"
                    key="createdAt"
                    width="10%"
                    render={(_, job: Job) => {
                        return <NiceRelativeTime time={new Date(this.firstState(job).at)} />;
                    }}
                    defaultSortOrder="descend"
                    sorter={true}
                    sortDirections={['ascend', 'descend']}
                />
                <Table.Column
                    title="Queued"
                    key="queuedElapsed"
                    width="10%"
                    render={(_, job: Job) => {
                        var [queueState, nextState] = this.lastEventLike(job, JobStateType.QUEUE);
                        if (queueState) {
                            if (nextState) {
                                return <NiceElapsedTime
                                    from={queueState.at}
                                    to={nextState.at}
                                    precision={2}
                                    useClock={false} />;
                            } else {
                                return <NiceElapsedTime
                                    from={queueState.at}
                                    precision={2}
                                    useClock={true} />;
                            }
                        } else {
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
                        var [runState, nextState] = this.lastEventLike(job, JobStateType.RUN);
                        if (runState) {
                            if (nextState) {
                                return <NiceElapsedTime
                                    from={runState.at}
                                    to={nextState.at}
                                    precision={2}
                                    useClock={false} />;
                            } else {
                                return <NiceElapsedTime
                                    from={runState.at}
                                    precision={2}
                                    useClock={true} />;
                            }
                        } else {
                            return <span>-</span>;
                        }
                    }}
                />
                <Table.Column
                    title="Status"
                    dataIndex="status"
                    key="status"
                    width="7%"
                    render={(_, job: Job) => {
                        return <JobStatusBadge job={job} />;
                    }}
                />
                <Table.Column
                    title="Server"
                    dataIndex="clientGroups"
                    key="clientGroups"
                    width="8%"
                    render={(_, job: Job) => {
                        if (job.request.app == null) {
                            return 'n/a';
                        }
                        return job.request.app.clientGroups.join(',');
                    }}
                />
                <Table.Column
                    title="Cancel"
                    dataIndex="action"
                    key="action"
                    width="5%"
                    render={(_, job: Job) => {
                        return this.renderJobAction(job);
                    }}
                />
            </Table>
        );
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
                <JobDetail jobID={this.state.selectedJob.id} admin={true} />
            </Modal>
        );
    }

    renderError(view: UserJobsViewDataError) {
        return (
            <Alert type="error" message={view.error.message} />
        );
    }

    renderSearching(view: UserJobsViewDataSearching) {
        return <React.Fragment>
            <div>{this.renderControlBar()}</div>
            {this.renderJobsTable(view)}
            {this.renderJobDetail()}
        </React.Fragment>;
    }

    renderReady(view: UserJobsViewDataReady) {
        return <React.Fragment>
            <div>{this.renderControlBar()}</div>
            {this.renderJobsTable(view)}
            {this.renderJobDetail()}
        </React.Fragment>;
    }

    renderInitialSearch(view: UserJobsViewDataInitialSearching) {
        return <React.Fragment>
            <div>{this.renderControlBar()}</div>
            <div><Spin tip="Loading...">
                <Alert type="info" message="Loading Initial Data"
                    description="Loading initial jobs..."></Alert></Spin> </div>
        </React.Fragment>;
    }


    renderView() {
        switch (this.props.view.searchState) {
            case JobSearchState.ERROR:
                return this.renderError(this.props.view);
            case JobSearchState.SEARCHING:
                return this.renderSearching(this.props.view);
            case JobSearchState.READY:
                return this.renderReady(this.props.view);
            case JobSearchState.INITIAL_SEARCHING:
                return this.renderInitialSearch(this.props.view);
            default:
                return '';
        }
    }

    render() {
        return (
            <div data-k-b-testhook-component="UserJobs" className="UserJobs">
                {this.renderView()}
            </div>
        );
    }
}