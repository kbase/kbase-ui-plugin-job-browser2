import React from 'react';

import { Tabs, Spin, Alert } from 'antd';
import JobLog from '../JobLog/view';
import JobInfo from '../JobInfo';
import './style.css'
import { JobLogView, JobLogState, JobLogViewError } from './state';

export interface Props {
    view: JobLogView
}

interface State {
}

export default class JobDetail extends React.Component<Props, State> {
    renderLoading() {
        return (
            <div>
                Loading ... <Spin />
            </div>
        );
    }

    renderQueued() {
        return (
            <div>
                Queued ... <Spin />
            </div>
        );
    }

    renderError(view: JobLogViewError) {
        return (
            <Alert type="error" message={view.error} />
        )
    }

    renderJobLog() {
        switch (this.props.view.status) {
            case JobLogState.NONE:
            case JobLogState.JOB_QUEUED:
                return this.renderQueued();
            case JobLogState.INITIAL_LOADING:
                return this.renderLoading();
            case JobLogState.ERROR:
                return this.renderError(this.props.view);
            case JobLogState.ACTIVE_LOADED:
            case JobLogState.ACTIVE_LOADING:
                return <JobLog job={this.props.view.job} log={this.props.view.log} />;
            case JobLogState.FINISHED_LOADED:
                return <JobLog job={this.props.view.job} log={this.props.view.log} />;
        }
    }
    renderJobInfo() {
        switch (this.props.view.status) {
            case JobLogState.NONE:
                return this.renderLoading();
            case JobLogState.JOB_QUEUED:
                return <JobInfo job={this.props.view.job} />;
            case JobLogState.INITIAL_LOADING:
                return this.renderLoading();
            case JobLogState.ERROR:
                return this.renderError(this.props.view);
            case JobLogState.ACTIVE_LOADED:
            case JobLogState.ACTIVE_LOADING:
                return <JobInfo job={this.props.view.job} />;
            case JobLogState.FINISHED_LOADED:
                return <JobInfo job={this.props.view.job} />;
        }
    }
    render() {
        return (
            <Tabs className="FullHeightTabs" defaultActiveKey="log" animated={false} >
                <Tabs.TabPane tab="log" key="log" forceRender={false}>
                    {this.renderJobLog()}
                </Tabs.TabPane>
                <Tabs.TabPane tab="detail" key="detail" forceRender={false}>
                    {this.renderJobInfo()}
                </Tabs.TabPane>
            </Tabs>
        )
    }
}