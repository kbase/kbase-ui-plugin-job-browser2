import React from 'react';
import './style.css';
import MyJobs from '../MyJobs';
import PublicAppStats from '../PublicAppStats';
import UserRunSummary from '../UserRunSummary';
import { MainParams } from './state';
import { Tab } from '../FlexTabs';
import { Icon } from 'antd';
import Tabs from '../AutoFlexTabs';
import AdminJobs from '../AdminJobs';

export interface MainProps {
    isAdmin: boolean;
    params: MainParams;
    view: string;
    setTitle: (title: string) => void;
    setView: (view: string) => void;
    setParams: (params: MainParams) => void;
}

interface MainState {
    tabs: Array<Tab>;
}

export default class Main extends React.Component<MainProps, MainState> {
    defaultTabKey: string;
    constructor(props: MainProps) {
        super(props);
        this.defaultTabKey = 'myJobs';

        const tabs: Array<Tab> = [];

        tabs.push({
            tab: 'myjobs',
            title: 'My Jobs',
            renderBody: () => {
                return this.renderMyJobsTab();
            }
        });

        if (this.props.isAdmin) {
            tabs.push({
                tab: 'adminjobs',
                title: <span>
                    User Jobs <Icon type="unlock" />
                </span>,
                renderBody: () => {
                    return <AdminJobs />;
                }
            });
        }

        tabs.push({
            tab: 'appstats',
            title: 'Public AppStats',
            renderBody: () => {
                return this.renderPublicAppStatsTab();
            }
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
                renderBody: () => {
                    return <UserRunSummary />;
                }
            });
        }

        this.state = {
            tabs
        };
    }

    componentDidMount() {
        this.props.setTitle('Job Browser');
    }

    componentWillUnmount() {
        // this.setState({
        //     activeTabKey: null
        //     // defaultActiveTabKey: null
        // });
    }

    onTabsChange(activeKey: string) {
        // console.log('tabs changed', activeKey, this.activeTabKey);
        // this.setState({ activeTabKey: activeKey });
        // this.state.activeTabKey = activeKey;
    }

    renderJobsTab() { }

    renderAdminJobsTab() { }

    renderMyJobsTab() {
        return <MyJobs />;
    }

    renderPublicAppStatsTab() {
        return <PublicAppStats />;
    }

    renderUserRunSummaryTab() {
        return <UserRunSummary />;
    }

    renderTabs() {
        // FIXME: The animated flag is set to false below because for some reason antd (on safari at least) is not
        // correctly rendering any tab other than the first one with animation enabled (which is default).
        // Please investigate and either find what we have done wrong or antd has.
        // return (
        //     <Tabs
        //         animated={false}
        //         // defaultActiveKey={this.state.activeTabKey || undefined}
        //         activeKey={this.props.params.tab || this.state.activeTabKey || undefined}
        //         // className="FlexTabs"
        //         onChange={this.onTabsChange.bind(this)}
        //         destroyInactiveTabPane={true}
        //     >
        //         <Tabs.TabPane tab="My Jobs" key="myJobs">
        //             <MyJobs />
        //         </Tabs.TabPane>

        //         <Tabs.TabPane tab="Public App Stats" key="publicAppStats">
        //             <PublicAppStats />
        //         </Tabs.TabPane>

        //         {userJobsTab}
        //         {userRunTab}
        //     </Tabs>
        // );


        return (
            <Tabs
                tabs={this.state.tabs}
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
