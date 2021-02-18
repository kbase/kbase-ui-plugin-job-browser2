/**
 * A component for browsing through (search, filter, sort) jobs submitted by
 * the current user.
 */

/** imports */
// 3rd party imports
import React from "react";
import {
    Form, Button, Select, Popconfirm, Tooltip,
    Modal, Switch, Input
} from 'antd';

// import moment, { Moment } from 'moment';

// project imports
import {
    Job, JobsSearchExpression, TimeRangePresets,
    TimeRange, SortSpec
} from '../../redux/store';
import JobDetail from '../JobDetail';

// kbase imports (or should be kbase imports)
import JobStatusBadge from '../JobStatusBadge';

// file imports
import './style.css';
import Monitor from '../Monitor';
import PubSub from '../../lib/PubSub';
import { JobEvent, JobStateType } from '../../redux/types/jobState';
import { JobContextNarrative } from '../../lib/JobBrowserBFFClient';
import UILink from '../UILink';
import Table2, { Column, AsyncProcessState, DataSource, TableConfig } from "../Table";
import FilterEditor, { JobFilter } from "../FilterEditor";
import { SearchOutlined, InfoCircleOutlined, CloseOutlined } from "@ant-design/icons";

import dayjs from 'dayjs';
import DatePicker from "../DatePicker";
import { SERVICE_TIMEOUT } from "../../constants";
import NiceRelativeTime from "../NiceRelativeTime";
import NiceElapsedTime from "../NiceElapsedTime";
import Search from "antd/lib/transfer/search";
import { isUndefined } from "node:util";

/**
 * This version of the job status defines the set of strings that may be used
 * in the ui controls.
 *
 */
// type JobStatusFilterKey = "queued" | "running" | "canceled" | "success" | "error";



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
// function jobStatusFilterOptionsToJobStatus(filter: Array<JobStatusFilterKey>): Array<JobStatus> {
//     let jobStatuses: Array<JobStatus> = [];
//     filter.forEach(status => {
//         switch (status) {
//             case "queued":
//                 jobStatuses.push(JobStatus.QUEUED);
//                 break;
//             case "running":
//                 jobStatuses.push(JobStatus.RUNNING);
//                 break;
//             case "canceled":
//                 jobStatuses.push(JobStatus.CANCELED_QUEUED);
//                 jobStatuses.push(JobStatus.CANCELED_RUNNING);
//                 break;
//             case "success":
//                 jobStatuses.push(JobStatus.FINISHED);
//                 break;
//             case "error":
//                 jobStatuses.push(JobStatus.ERRORED_QUEUED);
//                 jobStatuses.push(JobStatus.ERRORED_RUNNING);
//                 break;
//         }
//     });
//     return jobStatuses;
// }

/**
 * Semantic aliasing of for epoch time in milliseconds, as produced
 * by Date.now(), new Date().getTime(), etc.
 *
 * @todo move to a common location
 */

/**
 * Props for the MyJobs component
 */
export interface AdminJobsProps {
    dataSource: DataSource<Job>;
    // view: MyJobsView;
    /** The list of jobs to display */

    // jobs: Array<Job>;
    // foundCount: number;
    // totalCount: number;

    /** The current search state, used to control the primary display (none, searching, searched, error) */

    // searchState: SearchState;
    // showMonitoringControls: boolean

    /** Triggers a redux action to search of the user's jobs according to the given search expression
     * @remarks Since at present the service used to fetch the jobs can suffer performance issues, the
     * default search action does not fetch search results each time (rather ??).
     * @todo when job search is more performant, this function may be removed and redirected to the
     * search function.
     */
    search: (searchExpression: JobsSearchExpression) => void;
    refreshSearch: () => void;
    /** Triggers a redux action to cancel the indicated job */
    cancelJob: (jobID: string, timeout: number) => void;
    // searchExpression: JobsSearchExpression;
    narrativeMethodStoreURL: string;
}

/**
 * State for the MyJobs component
 */
interface AdminJobsState {
    /** Flag to show the date controls */
    showDates: boolean;
    /** Contains the current selection of job statuses in the checkbox control */
    // currentJobStatusFilter: Array<JobSearchStatus>;
    /** Contains the initial timestamp (ms epoch time) for time range */
    timeRange: TimeRange;

    isFilterOpen: boolean;

    selectedJob: Job | null;
    currentSort: SortSpec | null;
    // rowsPerPage: number;

    filter: JobFilter;
}

/**
 * A View Component for browsing through the current user's jobs.
 *
 * @remarks
 * This component is really just a tabular view into a user's jobs. It provides
 * support for free text searching, filtering by job state, and date ranges.
 *
 */
export default class AdminJobs extends React.Component<AdminJobsProps, AdminJobsState> {
    currentQuery?: string;
    offset: number;
    limit: number;
    sorting: SortSpec;
    currentPage: number;
    // rowsPerPage: number;

    static defaultTimeRangePreset: TimeRangePresets = "lastWeek";

    pubsub: PubSub;

    constructor(props: AdminJobsProps) {
        super(props);

        this.currentQuery = "";
        this.pubsub = new PubSub();
        this.offset = 0;
        this.limit = 1;
        this.currentPage = 0;
        this.sorting = {
            field: 'created',
            direction: 'descending'
        };

        this.state = {
            showDates: false,
            filter: {
                status: ['create', 'queue', 'run', 'terminate', 'complete', 'error']
            },
            timeRange: { kind: 'preset', preset: AdminJobs.defaultTimeRangePreset },
            isFilterOpen: false,
            selectedJob: null,
            currentSort: null
            // rowsPerPage: 1
        };
    }

    componentDidUpdate() {
        if (this.props.dataSource.status === AsyncProcessState.PROCESSING ||
            this.props.dataSource.status === AsyncProcessState.REPROCESSING) {
            this.pubsub.send('searching', { is: true });
        } else {
            this.pubsub.send("searching", { is: false });
        }
    }

    onChangeTimeRange(value: string) {
        // TODO: should narrow the string value
        if (value === "customRange") {
            this.setState({
                showDates: true,
                timeRange: { kind: "literal", start: Date.now(), end: Date.now() }
            });
            // nothing else to do.
            return;
        } else {
            this.setState(
                {
                    showDates: false,
                    timeRange: {
                        kind: 'preset',
                        preset: value as TimeRangePresets
                    }
                },
                () => {
                    this.offset = 0;
                    this.doSearch(true);
                }
            );
        }
    }

    onChangeQuery(event: React.ChangeEvent<HTMLInputElement>) {
        this.currentQuery = event.target.value;
    }

    onSubmit(values: any) {
        // event.preventDefault();
        this.doSearch(true);
    }

    onFirstPage() {
        if (this.props.dataSource.status !== AsyncProcessState.SUCCESS) {
            return;
        }

        const dataSource = this.props.dataSource;

        if (dataSource.page <= 1) {
            return;
        }

        // here we do it.
        this.offset = 0;

        this.doSearch(false);
    }

    onPreviousPage() {
        if (this.props.dataSource.status !== AsyncProcessState.SUCCESS) {
            return;
        }

        const dataSource = this.props.dataSource;

        if (dataSource.page <= 1) {
            return;
        }

        // here we do it.
        this.offset = (dataSource.page - 2) * dataSource.limit;
        this.limit = dataSource.limit;

        this.doSearch(false);
    }

    onNextPage() {
        if (this.props.dataSource.status !== AsyncProcessState.SUCCESS) {
            return;
        }

        const dataSource = this.props.dataSource;

        if (dataSource.page >= dataSource.pageCount) {
            return;
        }

        // here we do it.
        this.offset = dataSource.page * dataSource.limit;
        this.limit = dataSource.limit;

        this.doSearch(false);
    }

    onLastPage() {
        if (this.props.dataSource.status !== AsyncProcessState.SUCCESS) {
            return;
        }

        const dataSource = this.props.dataSource;

        if (dataSource.page >= dataSource.pageCount) {
            return;
        }

        // here we do it.
        this.offset = (dataSource.pageCount - 1) * dataSource.limit;
        this.limit = dataSource.limit;

        this.doSearch(false);
    }

    doSearch(forceSearch: boolean) {
        const searchExpression: JobsSearchExpression = {
            query: this.currentQuery,
            timeRange: this.state.timeRange,
            filter: this.state.filter,
            forceSearch,
            sort: this.sorting,
            offset: this.offset,
            limit: this.limit
        };


        // TODO: document wth is happening here.
        this.pubsub.send("search", { is: true });

        this.props.search(searchExpression);
        return false;
    }

    onRangeChange(range: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) {
        if (!range) {
            return;
        }

        const [fromDate, toDate] = range;

        let existingTimeRange = this.state.timeRange;
        let timeRange: TimeRange;
        switch (existingTimeRange.kind) {
            case "preset":
                timeRange = {
                    kind: "literal",
                    start: fromDate ? fromDate.valueOf() : 0,
                    end: toDate ? toDate.valueOf() : Infinity
                };
                break;
            case "literal":
                timeRange = {
                    kind: "literal",
                    start: fromDate ? fromDate.valueOf() : 0,
                    end: toDate ? toDate.valueOf() : Infinity
                };
                break;
            default:
                return;
        }

        this.setState({
            timeRange
        });
    }

    onChangeJobID(ev?: React.ChangeEvent<HTMLInputElement>) {
        if (ev) {
            this.setState({
                filter: {
                    job_id: [ev.target.value],
                    ...this.state.filter
                }
            });
        } else {
            this.setState({
                filter: {
                    job_id: undefined,
                    ...this.state.filter
                }
            });
        }
    }

    renderSearchInput() {
        let dateControls;
        if (this.state.showDates) {
            const timeRange = this.state.timeRange;
            if (timeRange.kind === "literal") {
                dateControls = (
                    <React.Fragment>
                        <DatePicker.RangePicker
                            showTime
                            allowClear={false}
                            value={[dayjs(timeRange.start), dayjs(timeRange.end)]}
                            onCalendarChange={this.onRangeChange.bind(this)}
                        />
                    </React.Fragment>
                );
            }
        }
        return (
            <Form layout="inline" onFinish={this.onSubmit.bind(this)}>
                <Form.Item label="Time Range">
                    <Select
                        defaultValue={AdminJobs.defaultTimeRangePreset}
                        onChange={this.onChangeTimeRange.bind(this)}
                        dropdownMatchSelectWidth={true}
                        style={{ width: "11em" }}
                    >
                        <Select.Option value="lastHour">Previous Hour</Select.Option>
                        <Select.Option value="last48Hours">Previous 48 Hours</Select.Option>
                        <Select.Option value="lastWeek">Previous Week</Select.Option>
                        <Select.Option value="lastMonth">Previous Month</Select.Option>
                        <Select.Option value="lastYear">Previous Year</Select.Option>
                        <Select.Option value="allTime">All Time</Select.Option>
                        <Select.Option value="customRange">Custom Range</Select.Option>
                    </Select>
                </Form.Item>
                {dateControls}

                <Form.Item style={{width: '17em'}}>
                    <Tooltip title="Search by job id">
                        <Input placeholder="Job ID" onChange={this.onChangeJobID.bind(this)}/>
                    </Tooltip>
                </Form.Item>

                <Form.Item>
                    <Tooltip title="Clicking this button triggers a search to be run using all of the current search input">
                        <Button icon={<SearchOutlined />} type="primary" htmlType="submit" />
                    </Tooltip>
                </Form.Item>

                <Form.Item>
                    <Switch
                        checkedChildren="hide filters"
                        unCheckedChildren="show filters"
                        onChange={this.onToggleFilterArea.bind(this)}
                    />
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
    }

    onFilterChange(filter: JobFilter) {
        this.setState({
            filter
        }, () => {
            this.offset = 0;
            this.doSearch(false);
        });
    }

    renderControlBar() {
        let filterRowStyle: React.CSSProperties = {
            position: 'relative'
        };
        if (!this.state.isFilterOpen) {
            filterRowStyle.display = "none";
        }
        let filterRow;
        if (this.state.isFilterOpen) {
            filterRow = (
                <div style={filterRowStyle}>
                    <div className="AdminJobs-filterPanel">
                        <div className="AdminJobs-filterArea">
                            <FilterEditor
                                filter={this.state.filter}
                                onChange={this.onFilterChange.bind(this)} />
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="Col">
                <div className="Row">{this.renderSearchInput()}</div>
                {filterRow}
            </div>
        );
    }

    onJobCancel(job: Job) {
        this.props.cancelJob(job.id, SERVICE_TIMEOUT);
    }

    renderJobAction(job: Job) {
        const currentState = this.currentJobState(job);
        if ([JobStateType.QUEUE, JobStateType.RUN].includes(currentState.type)) {
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
                        icon={<CloseOutlined />}
                        danger
                        size="small"
                        style={{ height: '22px', width: '22px' }}
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

    currentJobState(job: Job): JobEvent {
        return job.eventHistory[job.eventHistory.length - 1];
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


    getCreateAt(job: Job): number {
        return job.eventHistory[0].at;
    }

    renderNarrativeLink(context: JobContextNarrative) {
        return;
    }

    onReset() {
        this.offset = 0;
        this.doSearch(true);
    }

    renderJobsTable() {
        // const loading = view.searchState === JobSearchState.SEARCHING;
        const columns: Array<Column<Job>> = [
            {
                id: 'jobid',
                label: 'Job',
                render: (job: Job) => {
                    const title = <div>
                        <p><span style={{ color: 'silver' }}>Job</span>{' '}{job.id}</p>
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
                                icon={<InfoCircleOutlined />}
                            />
                        </Tooltip>
                    );
                }
            },
            {
                id: 'user',
                label: 'User',
                render: (job: Job) => {
                    return (
                        <UILink path={`people/${job.request.owner.username}`}
                            openIn='new-tab'>
                            {job.request.owner.realname}
                        </UILink>
                    );
                }
            },
            // {
            //     id: 'narrative',
            //     label: 'Narrative',
            //     render: (job: Job) => {
            //         switch (job.request.context.type) {
            //             case JobContextType.NARRATIVE:
            //                 const title = job.request.context.title;
            //                 if (job.request.context.isTemporary) {
            //                     return (
            //                         <Tooltip title={'A temporary, unsaved narrative'}>
            //                             <NarrativeLink narrativeID={job.request.context.workspace.id}>
            //                                 Unsaved Narrative
            //                             </NarrativeLink>
            //                         </Tooltip>
            //                     );
            //                 } else {
            //                     return (
            //                         <Tooltip title={title || 'n/a'}>
            //                             <NarrativeLink narrativeID={job.request.context.workspace.id}>
            //                                 {title || 'n/a'}
            //                             </NarrativeLink>
            //                         </Tooltip>
            //                     );
            //                 }


            //             case JobContextType.WORKSPACE:
            //                 if (job.request.context.workspace.isAccessible) {
            //                     return job.request.context.workspace.name;
            //                 } else {
            //                     return 'inaccessible workspace';
            //                 }
            //             case JobContextType.EXPORT:
            //                 return 'export job';
            //             case JobContextType.UNKNOWN:
            //                 return 'unknown';
            //         }
            //     }
            // },
            {
                id: 'app',
                label: 'App',
                render: (job: Job) => {
                    if (job.request.app === null) {
                        return 'n/a';
                    }
                    const appTitle = job.request.app.title;
                    if (!appTitle) {
                        return 'n/a';
                    }
                    if (job.request.app.type === 'narrative') {
                        let icon;
                        if (job.request.app.iconURL) {
                            const url = [
                                this.props.narrativeMethodStoreURL.split('/').slice(0, -1).join('/'),
                                job.request.app.iconURL
                            ].join('/');
                            icon = <span>
                                <img src={url} height='24px' alt={job.request.app.title} />
                                {' '}
                            </span>;
                        }
                        return (
                            <Tooltip title={appTitle}>
                                <UILink path={`catalog/apps/${job.request.app.id}`}
                                    openIn='new-tab'>
                                    {icon}{appTitle}
                                </UILink>
                            </Tooltip>
                        );
                    } else {
                        return (
                            <Tooltip title={appTitle}>
                                <span>{appTitle}</span>
                            </Tooltip>
                        );
                    }
                }
            },
            {
                id: 'submitted',
                label: 'Submitted',
                render: (job: Job) => {
                    const createAt = this.getCreateAt(job);
                    return <NiceRelativeTime time={new Date(createAt)} key={createAt} />;
                }
            },
            {
                id: 'queued',
                label: 'Queued',
                render: (job: Job) => {
                    var [queueState, nextState] = this.lastEventLike(job, JobStateType.QUEUE);
                    if (queueState) {
                        if (nextState) {
                            return <NiceElapsedTime
                                key={queueState.at}
                                from={queueState.at}
                                to={nextState.at}
                                precision={2}
                                useClock={false} />;
                        } else {
                            return <NiceElapsedTime
                                key={queueState.at}
                                from={queueState.at}
                                precision={2}
                                useClock={true} />;
                        }
                    } else {
                        return <span>-</span>;
                    }
                }
            },
            {
                id: 'run',
                label: 'Run',
                render: (job: Job) => {
                    var [runState, nextState] = this.lastEventLike(job, JobStateType.RUN);
                    if (runState) {
                        if (nextState) {
                            return <NiceElapsedTime
                                key={runState.at}
                                from={runState.at}
                                to={nextState.at}
                                precision={2}
                                useClock={false} />;
                        } else {
                            return <NiceElapsedTime
                                key={runState.at}
                                from={runState.at}
                                precision={2}
                                useClock={true} />;
                        }
                    } else {
                        return <span>-</span>;
                    }
                }
            },
            {
                id: 'status',
                label: 'Status',
                render: (job: Job) => {
                    return <JobStatusBadge job={job} />;
                }
            },
            {
                id: 'server',
                label: 'Server',
                render: (job: Job) => {
                    return job.request.clientGroup;
                }
            },
            {
                id: 'cancel',
                label: 'Cancel',
                render: (job: Job) => {
                    return this.renderJobAction(job);
                }
            }
        ];
        return <Table2<Job>
            dataSource={this.props.dataSource}
            firstPage={this.onFirstPage.bind(this)}
            previousPage={this.onPreviousPage.bind(this)}
            nextPage={this.onNextPage.bind(this)}
            lastPage={this.onLastPage.bind(this)}
            reset={this.onReset.bind(this)}
            columns={columns}
            noun={{ singular: 'job', plural: 'jobs' }}
            config={this.updateTableConfig.bind(this)} />;
    }

    updateTableConfig(config: TableConfig) {
        if (this.limit === config.rowsPerPage) {
            return;
        }
        this.limit = config.rowsPerPage;
        if (this.props.dataSource.status === AsyncProcessState.SUCCESS ||
            this.props.dataSource.status === AsyncProcessState.REPROCESSING) {
            const newPageCount = Math.ceil(this.props.dataSource.total / config.rowsPerPage);
            if (this.currentPage !== null) {
                if (this.currentPage > newPageCount) {
                    this.currentPage = newPageCount;
                }
            }
        }
        this.doSearch(false);
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
                Detail for Job <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>{this.state.selectedJob.id}</span>
            </span>
        );
        return (
            <Modal
                className="FullScreenModal"
                title={title}
                onCancel={this.onCloseModal.bind(this)}
                visible={true}
                footer={footer}>
                <JobDetail
                    jobID={this.state.selectedJob.id}
                    admin={true} />
            </Modal>
        );
    }

    // renderError(view: MyJobsViewDataError) {
    //     return (
    //         <Alert type="error" message={view.error.message} />
    //     );
    // }

    // renderSearching(view: MyJobsViewDataSearching) {
    //     return <React.Fragment>
    //         <div>{this.renderControlBar()}</div>
    //         {this.renderJobsTable(view)}
    //         {this.renderJobDetail()}
    //     </React.Fragment>;
    // }

    // renderReady(view: MyJobsViewDataReady) {
    //     return <React.Fragment>
    //         <div>{this.renderControlBar()}</div>
    //         {this.renderJobsTable(view)}
    //         {this.renderJobDetail()}
    //     </React.Fragment>;
    // }

    // renderInitialSearch(view: MyJobsViewDataInitialSearching) {
    //     return <React.Fragment>
    //         <div>{this.renderControlBar()}</div>
    //         <div><Spin tip="Loading...">
    //             <Alert type="info" message="Loading Initial Data"
    //                 description="Loading initial jobs..."></Alert></Spin> </div>
    //     </React.Fragment>;
    // }

    renderView() {
        // this.render
        // switch (this.props.view.loadingState) {
        //     case ComponentLoadingState.NONE:
        // }
        // switch (this.props.view.searchState) {
        //     case JobSearchState.ERROR:
        //         return this.renderError(this.props.view);
        //     case JobSearchState.SEARCHING:
        //         return this.renderSearching(this.props.view);
        //     case JobSearchState.READY:
        //         return this.renderReady(this.props.view);
        //     case JobSearchState.INITIAL_SEARCHING:
        //         return this.renderInitialSearch(this.props.view);
        //     default:
        //         return '';
        // }
        return <React.Fragment>
            <div className="-controlBar">{this.renderControlBar()}</div>
            {this.renderJobsTable()}
            {this.renderJobDetail()}
        </React.Fragment>;
    }

    render() {
        return (
            <div data-k-b-testhook-component="AdminJobs" className="AdminJobs">
                {this.renderView()}
            </div>
        );
    }
}