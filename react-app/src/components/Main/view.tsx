import React from 'react';
import { Tabs, Icon } from 'antd';
import './style.css';
import UserJobs from '../UserJobs';
import MyJobs from '../MyJobs';
import PublicAppStats from '../PublicAppStats';
import UserRunSummary from '../UserRunSummary';
import { MainParams } from './state';

export interface MainProps {
    isAdmin: boolean;
    params: MainParams;
    view: string;
    setTitle: (title: string) => void;
    setView: (view: string) => void;
    setParams: (params: MainParams) => void;
}

interface MainState {
    activeTabKey: string | null;
    defaultActiveTabKey: string | null;
}

export default class Main extends React.Component<MainProps, MainState> {
    defaultTabKey: string;
    constructor(props: MainProps) {
        super(props);
        this.defaultTabKey = 'myJobs';
        this.state = {
            activeTabKey: this.defaultTabKey,
            defaultActiveTabKey: this.defaultTabKey
        };
    }

    componentDidMount() {
        this.props.setTitle('Job Browser');

        // window.setTimeout(() => {
        //     this.props.setParams({ tab: 'userJobs' });
        // }, 1000);
    }

    componentWillUnmount() {
        this.setState({
            activeTabKey: null
            // defaultActiveTabKey: null
        });
    }

    onTabsChange(activeKey: string) {
        // console.log('tabs changed', activeKey, this.activeTabKey);
        this.setState({ activeTabKey: activeKey });
        // this.state.activeTabKey = activeKey;
    }

    renderJobsTab() { }

    renderAdminJobsTab() { }

    renderTabs() {
        let userRunTab;
        let userJobsTab;
        // console.log('rendering, admin?', this.props.isAdmin);
        if (this.props.isAdmin) {
            const tabLabel = (
                <span>
                    User Run Summary <Icon type="unlock" />
                </span>
            );
            userRunTab = (
                <Tabs.TabPane tab={tabLabel} key="userRunSummary">
                    <UserRunSummary />
                </Tabs.TabPane>
            );
            const userJobsTabLabel = (
                <span>
                    User Jobs <Icon type="unlock" />
                </span>
            );
            userJobsTab = (
                <Tabs.TabPane tab={userJobsTabLabel} key="userJobs">
                    <UserJobs />
                </Tabs.TabPane>
            );
        }

        // FIXME: The animated flag is set to false below because for some reason antd (on safari at least) is not
        // correctly rendering any tab other than the first one with animation enabled (which is default).
        // Please investigate and either find what we have done wrong or antd has.
        // console.log('default active tab key?', this.state.defaultActiveTabKey);
        return (
            <Tabs
                animated={false}
                // defaultActiveKey={this.state.activeTabKey || undefined}
                activeKey={this.props.params.tab || this.state.activeTabKey || undefined}
                // className="FlexTabs"
                onChange={this.onTabsChange.bind(this)}
                destroyInactiveTabPane={true}
            >
                <Tabs.TabPane tab="My Jobs" key="myJobs">
                    <MyJobs />
                </Tabs.TabPane>

                <Tabs.TabPane tab="Public App Stats" key="publicAppStats">
                    <PublicAppStats />
                </Tabs.TabPane>

                {userJobsTab}
                {userRunTab}
            </Tabs>
        );
    }

    render() {
        return <div className="Col Col-scrollable">{this.renderTabs()}</div>;
    }
}
