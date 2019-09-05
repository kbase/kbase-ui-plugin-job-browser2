import React from 'react';

import { Spin, Alert } from 'antd';
import FlexTabs from './FlexTabs';
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
            <div className="FullyCenteredBox">
                <span>Loading ... <Spin /></span>
            </div>
        );
    }

    renderQueued() {
        return (
            <div className="FullyCenteredBox">
                <span>
                    The job is <i>queued</i>. The log will be displayed when the job starts running ... <Spin />
                </span>
            </div >
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
    renderTest() {
        const content = Array.from(Array(100).keys()).map((i) => {
            return <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'row', borderBottom: '1px silver solid' }} key={String(i)}>
                <div style={{ flex: '0 0 auto', padding: '4px', overflowWrap: 'break-word', wordWrap: 'break-word' }}>
                    {i}
                </div>
            </div>
        });
        return (
            <div style={{ flex: '1 1 0px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div>Header Here</div>
                <div style={{ flex: '1 1 0px', display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
                    {content}
                </div>
            </div>
        )
    }
    renderTest2() {
        const content = Array.from(Array(100).keys()).map((i) => {
            return <div className="FlexTable-row" key={String(i)}>
                <div className="FlexTable-col">{i}</div>
                <div className="FlexTable-col">This is row {i}</div>
            </div>
        });
        return (
            <div className="FlexTable">
                <div className="FlexTable-header">
                    <div className="FlexTable-row">
                        <div className="FlexTable-col">#</div>
                        <div className="FlexTable-col">Data</div>
                    </div>
                </div>
                <div className="FlexTable-body">
                    {content}
                </div>
            </div>
        )
    }
    render() {
        const tabs = [
            {
                tab: 'log',
                title: 'Log',
                component: this.renderJobLog()
            },
            {
                tab: 'detail',
                title: 'Detail',
                component: this.renderJobInfo()
            },
            // {
            //     tab: 'test',
            //     title: 'Test',
            //     component: this.renderTest()
            // },
            // {
            //     tab: 'test2',
            //     title: 'Test2',
            //     component: this.renderTest2()
            // }
        ]
        return (
            <FlexTabs tabs={tabs} />
        )
    }
    // render() {
    //     return (
    //         <Tabs className="FullHeightTabs" defaultActiveKey="log" animated={false} >
    //             <Tabs.TabPane tab="log" key="log" forceRender={false}>
    //                 {this.renderJobLog()}
    //             </Tabs.TabPane>
    //             <Tabs.TabPane tab="detail" key="detail" forceRender={false}>
    //                 {this.renderJobInfo()}
    //             </Tabs.TabPane>
    //         </Tabs>
    //     )
    // }
}