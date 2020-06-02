import React from 'react';
import View from './view';
import { message } from 'antd';

import { Job, JobsSearchExpression } from '../../redux/store';
import { DataSource, AsyncProcessState } from '../Table';
import MyJobsRequest from './MyJobsRequest';
import JobBrowserBFFClient from '../../lib/JobBrowserBFFClient';
import { JobStateType } from '../../redux/types/jobState';
import { SERVICE_TIMEOUT } from '../../constants';
import { JSONRPC20Exception } from '../../lib/comm/JSONRPC20/JSONRPC20';
import { DynamicServiceConfig } from '@kbase/ui-components/lib/redux/integration/store';

export interface DataProps {
    token: string;
    username: string;
    serviceWizardURL: string;
    narrativeMethodStoreURL: string;
    jobBrowserBFFConfig: DynamicServiceConfig;
}

interface DataState {
    dataSource: DataSource<Job>;
}

const myJobsSearchRequests = new MyJobsRequest();

export default class Data extends React.Component<DataProps, DataState> {
    searchExpression: JobsSearchExpression | null;
    constructor(props: DataProps) {
        super(props);
        this.searchExpression = null;
        this.state = {
            dataSource: {
                status: AsyncProcessState.NONE
            }
        };
    }
    async doSearch(searchExpression: JobsSearchExpression) {
        if (this.state.dataSource.status === AsyncProcessState.SUCCESS) {
            this.setState({
                dataSource: {
                    ...this.state.dataSource,
                    status: AsyncProcessState.REPROCESSING
                }
            });
        } else {
            this.setState({
                dataSource: {
                    status: AsyncProcessState.PROCESSING
                }
            });
        }

        const task = myJobsSearchRequests.spawn({
            token: this.props.token,
            username: this.props.username,
            serviceWizardURL: this.props.serviceWizardURL,
            searchExpression,
            jobBrowserBFFConfig: this.props.jobBrowserBFFConfig
        });

        try {
            const { jobs, foundCount, totalCount } = await task.promise;
            if (task.isCanceled) {
                // just do nothing
                return;
            }

            myJobsSearchRequests.done(task);

            const { limit, offset } = searchExpression;
            const page = Math.ceil((offset + limit) / limit);
            const pageCount = Math.ceil(totalCount / limit);

            this.setState({
                dataSource: {
                    status: AsyncProcessState.SUCCESS,
                    data: jobs,
                    count: foundCount,
                    total: totalCount,
                    limit,
                    offset,
                    page,
                    pageCount
                }
            });
        } catch (ex) {
            if (ex instanceof JSONRPC20Exception) {
                console.error('error', ex.error);
                this.setState({
                    dataSource: {
                        status: AsyncProcessState.ERROR,
                        error: {
                            code: ex.error.code,
                            message: ex.error.message,
                            data: ex.error.data
                        }
                    }
                });
            } else {
                this.setState({
                    dataSource: {
                        status: AsyncProcessState.ERROR,
                        error: {
                            code: 0,
                            message: ex.message
                        }
                    }
                });
            }
        }
    }

    search(searchExpression: JobsSearchExpression) {
        this.searchExpression = searchExpression;
        this.doSearch(searchExpression);
    }

    cancelJob(jobId: string, timeout: number) {
        // do it
        const client = new JobBrowserBFFClient({
            url: this.props.serviceWizardURL,
            token: this.props.token,
            timeout: SERVICE_TIMEOUT,
            version: this.props.jobBrowserBFFConfig.version
        });
        client
            .cancel_job({
                job_id: jobId,
                timeout,
                admin: false
            })
            .then(() => {
                const dataSource = this.state.dataSource;
                message.success('Successfully canceled the job');
                if (this.state.dataSource.status === AsyncProcessState.SUCCESS) {
                    for (const datum of this.state.dataSource.data) {
                        if (datum.id === jobId) {
                            datum.eventHistory.push({
                                at: new Date().getTime(),
                                type: JobStateType.TERMINATE,
                                code: 0
                            });
                            this.setState({
                                dataSource
                            });
                            return;
                        }
                    }
                }
            })
            .catch((err) => {
                console.error("error canceling job", err);
                message.error('Error canceling job: ' + err.message);
            });
    }

    refreshSearch() {

    }
    render() {
        return <View
            dataSource={this.state.dataSource}
            search={this.search.bind(this)}
            cancelJob={this.cancelJob.bind(this)}
            refreshSearch={this.refreshSearch.bind(this)}
            narrativeMethodStoreURL={this.props.narrativeMethodStoreURL}
        />;
    }
}