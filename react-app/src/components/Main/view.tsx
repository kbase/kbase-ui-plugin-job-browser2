import React from 'react';
import './style.css';
import UserJobs from '../UserJobs';
import MyJobs from '../MyJobs';
import PublicAppStats from '../PublicAppStats';
import UserRunSummary from '../UserRunSummary';
import { MainParams } from './state';
import FlexTabs, { Tab } from '../FlexTabs';
import { Icon } from 'antd';

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
    }

    componentWillUnmount() {
        this.setState({
            activeTabKey: null
            // defaultActiveTabKey: null
        });
    }

    onTabsChange(activeKey: string) {
        this.setState({ activeTabKey: activeKey });
        // this.state.activeTabKey = activeKey;
    }

    renderJobsTab() { }

    renderAdminJobsTab() { }

    renderMyJobsTab() {
        return <MyJobs />
    }

    renderUserJobsTab() {
        return <UserJobs />
    }

    renderPublicAppStatsTab() {
        return <PublicAppStats />
    }

    renderUserRunSummaryTab() {
        return <UserRunSummary />
    }

    renderTabs() {
        const tabs: Array<Tab> = [];

        tabs.push({
            tab: 'myjobs',
            title: 'My Jobs',
            component: this.renderMyJobsTab()
        });

        if (this.props.isAdmin) {
            const userJobsTabLabel = (
                <span>
                    User Jobs <Icon type="unlock" />
                </span>
            );
            tabs.push({
                tab: 'userjobs',
                title: userJobsTabLabel,
                component: <UserJobs />
            })
        }

        tabs.push({
            tab: 'appstats',
            title: 'Public AppStats',
            component: this.renderPublicAppStatsTab()
        });

        if (this.props.isAdmin) {
            const tabLabel = (
                <span>
                    User Run Summary <Icon type="unlock" />
                </span>
            );
            tabs.push({
                tab: 'userrunsummary',
                title: tabLabel,
                component: <UserRunSummary />
            })
        }

        return (
            <FlexTabs
                tabs={tabs}
            />
        );
    }

    render() {
        return <div
            className="Col Col-scrollable"
            data-k-b-testhook-plugin="job-browser2"
        >
            {this.renderTabs()}
        </div>;
    }
}
