import React from 'react';
import { Tabs, Icon } from 'antd';
import './style.css';
import UserJobs from '../UserJobs';
import MyJobs from '../MyJobs';
import PublicAppStats from '../PublicAppStats';
import UserRunSummary from '../UserRunSummary';

export interface TabPaneLifeCycleProps {
    active: boolean;
}

export interface TabPaneLifeCycleState {}

export class TabPaneLifeCycle extends React.Component<TabPaneLifeCycleProps, TabPaneLifeCycleState> {
    render() {
        if (!this.props.active) {
            // console.log('LC: destroying');
            return null;
        }
        // console.log('LC: rendering');
        return this.props.children;
    }
}

export interface MainProps {
    isAdmin: boolean;
}

interface MainState {
    activeTabKey: string | null;
    defaultActiveTabKey: string | null;
}

export default class Main extends React.Component<MainProps, MainState> {
    defaultTabKey: string;
    constructor(props: MainProps) {
        super(props);
        // this.activeTabKey = 'myJobs';
        this.defaultTabKey = 'myJobs';
        this.state = {
            activeTabKey: null,
            defaultActiveTabKey: null
        };
    }

    componentDidMount() {
        this.setState({
            activeTabKey: this.defaultTabKey,
            defaultActiveTabKey: this.defaultTabKey
        });
    }

    componentWillUnmount() {
        // console.log('unmounting?');
        this.setState({
            activeTabKey: null,
            defaultActiveTabKey: null
        });
    }

    onTabsChange(activeKey: string) {
        // console.log('tabs changed', activeKey, this.activeTabKey);
        this.setState({ activeTabKey: activeKey });
        // this.state.activeTabKey = activeKey;
    }

    renderJobsTab() {}

    renderAdminJobsTab() {}

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
                    <TabPaneLifeCycle active={this.state.activeTabKey === 'userRunSummary'}>
                        <UserRunSummary />
                    </TabPaneLifeCycle>
                </Tabs.TabPane>
            );
            const userJobsTabLabel = (
                <span>
                    User Jobs <Icon type="unlock" />
                </span>
            );
            userJobsTab = (
                <Tabs.TabPane tab={userJobsTabLabel} key="userJobs">
                    <TabPaneLifeCycle active={this.state.activeTabKey === 'userJobs'}>
                        <UserJobs />
                    </TabPaneLifeCycle>
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
                defaultActiveKey={this.state.defaultActiveTabKey || undefined}
                className="FlexTabs"
                onChange={this.onTabsChange.bind(this)}
            >
                <Tabs.TabPane tab="My Jobs" key="myJobs">
                    <TabPaneLifeCycle active={this.state.activeTabKey === 'myJobs'}>
                        <MyJobs />
                    </TabPaneLifeCycle>
                </Tabs.TabPane>

                <Tabs.TabPane tab="Public App Stats" key="publicAppStats">
                    <TabPaneLifeCycle active={this.state.activeTabKey === 'publicAppStats'}>
                        <PublicAppStats />
                    </TabPaneLifeCycle>
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
