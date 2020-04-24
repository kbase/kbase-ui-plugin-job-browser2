/**
 * A component for browsing through (search, filter, sort) jobs submitted by
 * the current user.
 */

/** imports */
// 3rd party imports
import React from "react";
import {
    Form, Button, Select, DatePicker, Popconfirm, Tooltip,
    Modal, Switch
} from 'antd';

import moment, { Moment } from 'moment';

// project imports
import {
    Job, JobsSearchExpression, TimeRangePresets,
    TimeRange, SortSpec, JobContextType
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
import NarrativeLink from '../NarrativeLink';
import { JobContextNarrative } from '../../lib/JobBrowserBFFClient';
import UILink from '../UILink';
import Table2, { Column, AsyncProcessState, DataSource, TableConfig } from "../Table";
import FilterEditor, { JobFilter } from "../FilterEditor";

const CANCEL_TIMEOUT = 10000;

/**
 * This version of the job status defines the set of strings that may be used
 * in the ui controls.
 *
 */
type JobStatusFilterKey = "queued" | "running" | "canceled" | "success" | "error";



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
export interface MyJobsProps {
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
}

/**
 * State for the MyJobs component
 */
interface MyJobsState {
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
export default class MyJobs extends React.Component<MyJobsProps, MyJobsState> {
    currentQuery?: string;
    offset: number;
    limit: number;
    sorting: SortSpec;
    currentPage: number;
    // rowsPerPage: number;

    static defaultTimeRangePreset: TimeRangePresets = "lastWeek";

    pubsub: PubSub;

    constructor(props: MyJobsProps) {
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
            timeRange: { kind: 'preset', preset: MyJobs.defaultTimeRangePreset },
            isFilterOpen: false,
            selectedJob: null,
            currentSort: null
            // rowsPerPage: 1
        };
    }

    async componentDidMount() {

    }

    // onResize(rowsPerPage: number) {
    //     // It would be nice to rely upon the table component to trigger a 
    //     // change even if we change the rows per page ... but we change the 
    //     // rows per page via the table props, not by a trigger.
    //     // Perhaps by wrapping the table or subclassing it?

    //     this.limit = rowsPerPage;
    //     this.offset = this.currentPage * rowsPerPage;

    //     // This causes the table to rerender, but without triggering a
    //     // re-search;
    //     // this.setState({
    //     //     rowsPerPage
    //     // });

    //     // This triggers a fresh search.
    //     this.doSearch(false);
    // }

    componentDidUpdate() {
        if (this.props.dataSource.status === AsyncProcessState.PROCESSING) {
            this.pubsub.send('searching', { is: true });
        } else {
            this.pubsub.send("searching", { is: false });
            // this.tableResizer.setRowsPerPage();
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

    // onTableChanged(pagination: PaginationConfig, filters: any, sorter: SorterResult<Job>) {
    //     console.log('table changed??', pagination);
    //     // Calculate offset and limit based on current pagination
    //     const currentPage = (pagination.current || 1) - 1;
    //     const currentPageSize = pagination.pageSize || 5;

    //     this.currentPage = pagination.current || 0;
    //     this.offset = currentPage * currentPageSize;
    //     this.limit = currentPageSize;

    //     // Calculate the sort spec 
    //     // Only create at sort order is supported.
    //     switch (sorter.columnKey) {
    //         case 'createAt':
    //             switch (sorter.order) {
    //                 case 'ascend':
    //                     this.sorting = {
    //                         field: 'created',
    //                         direction: 'ascending'
    //                     };
    //                     break;
    //                 case 'descend':
    //                 default:
    //                     this.sorting = {
    //                         field: 'created',
    //                         direction: 'descending'
    //                     };
    //             }
    //             break;
    //         default:
    //             this.sorting = {
    //                 field: 'created',
    //                 direction: 'descending'
    //             };
    //     }

    //     this.doSearch(false);
    // }
    onFirstPage() {
        console.log('on first');
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
        if (typeof this.currentQuery === "undefined") {
            return;
        }

        const searchExpression: JobsSearchExpression = {
            query: this.currentQuery,
            timeRange: this.state.timeRange,
            filter: this.state.filter,
            forceSearch,
            sort: this.sorting,
            offset: this.offset,
            limit: this.limit
        };

        console.log('searching with', searchExpression);

        // TODO: document wth is happening here.
        this.pubsub.send("search", {});

        this.props.search(searchExpression);
        return false;
    }

    onRangeFromChange(date: Moment | null, dateString: string) {
        // TODO: if the range ends up null (how?), should it default
        // to the previously selected preset? For now, just go back to lastHourl.
        if (date === null) {
            this.setState({
                timeRange: {
                    kind: "preset",
                    preset: "lastHour"
                }
            });
            return;
        }

        // handle logic of switching from 'preset' to 'literal'
        let existingTimeRange = this.state.timeRange;
        let timeRange: TimeRange;
        switch (existingTimeRange.kind) {
            case "preset":
                timeRange = {
                    kind: "literal",
                    start: date.valueOf(),
                    end: Infinity
                };
                break;
            case "literal":
                timeRange = {
                    kind: "literal",
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
                    kind: "preset",
                    preset: "lastHour"
                }
            });
            return;
        }

        let existingTimeRange = this.state.timeRange;
        let timeRange: TimeRange;
        switch (existingTimeRange.kind) {
            case "preset":
                timeRange = {
                    kind: "literal",
                    start: Infinity,
                    end: date.valueOf()
                };
                break;
            case "literal":
                timeRange = {
                    kind: "literal",
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
            if (timeRange.kind === "literal") {
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
                <Form.Item label="Time Range">
                    <Select
                        defaultValue={MyJobs.defaultTimeRangePreset}
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

                <Form.Item>
                    <Tooltip title="Clicking this button triggers a search to be run using all of the current search input">
                        <Button icon="search" type="primary" htmlType="submit" />
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
                    <div className="MyJobs-filterPanel">
                        <div className="MyJobs-filterArea">
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
        this.props.cancelJob(job.id, CANCEL_TIMEOUT);
    }

    renderJobAction(job: Job) {
        const currentState = this.currentJobState(job);
        if ([JobStateType.CREATE, JobStateType.QUEUE, JobStateType.RUN].includes(currentState.type)) {
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

    currentJobState(job: Job): JobEvent {
        return job.eventHistory[job.eventHistory.length - 1];
    }

    // lastQueueState(job: Job): JobEvent {
    //     for (let i = job.eventHistory.length - 1; i >= 0; i -= 1) {
    //         const jobEvent = job.eventHistory[i];
    //         if (jobEvent.type === JobStateType.QUEUE) {
    //             return jobEvent;
    //         }
    //     }
    //     // TODO: a better way of ensuring we have the right sequence of events (as defined in types)
    //     throw new Error('No QUEUE state');

    // }

    // lastRunState(job: Job): JobEvent {
    //     for (let i = job.eventHistory.length - 1; i >= 0; i -= 1) {
    //         const jobEvent = job.eventHistory[i];
    //         if (jobEvent.type === JobStateType.RUN) {
    //             return jobEvent;
    //         }
    //     }
    //     // TODO: a better way of ensuring we have the right sequence of events (as defined in types)
    //     throw new Error('No RUN state');
    // }

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


    getCreateAt(job: Job): Date {
        return new Date(job.eventHistory[0].at);
    }

    renderNarrativeLink(context: JobContextNarrative) {
        return;
    }

    renderJobsTable() {
        // const loading = view.searchState === JobSearchState.SEARCHING;
        const columns: Array<Column<Job>> = [
            {
                id: 'jobid',
                label: 'Job Id',
                render: (job: Job) => {
                    const title = <div>
                        <p><span style={{ color: 'silver' }}>Job ID</span>{' '}{job.id}</p>
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
            {
                id: 'narrative',
                label: 'Narrative',
                render: (job: Job) => {
                    switch (job.request.context.type) {
                        case JobContextType.NARRATIVE:
                            const title = job.request.context.title;
                            if (job.request.context.isTemporary) {
                                return (
                                    <Tooltip title={'A temporary, unsaved narrative'}>
                                        <NarrativeLink narrativeID={job.request.context.workspace.id}>
                                            Unsaved Narrative
                                        </NarrativeLink>
                                    </Tooltip>
                                );
                            } else {
                                return (
                                    <Tooltip title={title || 'n/a'}>
                                        <NarrativeLink narrativeID={job.request.context.workspace.id}>
                                            {title || 'n/a'}
                                        </NarrativeLink>
                                    </Tooltip>
                                );
                            }


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
                }
            },
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
                    return (
                        <Tooltip title={appTitle}>
                            <UILink path={`catalog/apps/${job.request.app.id}`}
                                openIn='new-tab'>
                                {appTitle}
                            </UILink>
                        </Tooltip>
                    );
                }
            },
            {
                id: 'submitted',
                label: 'Submitted',
                render: (job: Job) => {
                    return <NiceRelativeTime time={this.getCreateAt(job)} />;
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
            columns={columns}
            config={this.updateTableConfig.bind(this)} />;
    }

    updateTableConfig(config: TableConfig) {
        console.log('table config?', config);
        this.limit = config.rowsPerPage;
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
            <div>{this.renderControlBar()}</div>
            {this.renderJobsTable()}
            {this.renderJobDetail()}
        </React.Fragment>;
    }

    render() {
        return (
            <div data-k-b-testhook-component="MyJobs" className="MyJobs">
                {this.renderView()}
            </div>
        );
    }
}