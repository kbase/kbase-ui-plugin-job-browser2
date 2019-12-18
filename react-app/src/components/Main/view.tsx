import React from 'react';
import './style.css';
import UserJobs from '../UserJobs';
import MyJobs from '../MyJobs';
import PublicAppStats from '../PublicAppStats';
import UserRunSummary from '../UserRunSummary';
import { MainParams } from './state';
import { Tab } from '../FlexTabs';
import { Icon } from 'antd';
import Tabs from '../AutoFlexTabs';

export interface MainProps {
    isAdmin: boolean;
    params: MainParams;
    view: string;
    setTitle: (title: string) => void;
    setView: (view: string) => void;
    setParams: (params: MainParams) => void;
}

interface MainState {
    tabs: Array<Tab>
}

export default class Main extends React.Component<MainProps, MainState> {
    defaultTabKey: string;
    constructor(props: MainProps) {
        super(props);
        this.defaultTabKey = 'myJobs';


        // const tabs: Map<string, Tab> = new Map();
        // let tabOrder: Array<string>;
        // const selectedTab = 'myjobs';

        const tabs: Array<Tab> = [];

        // if (this.props.isAdmin) {
        //     tabOrder = ['myjobs', 'userjobs', 'appstats', 'userrunsummary']
        // } else {
        //     tabOrder = ['myjobs', 'appstats',]
        // }

        tabs.push({
            tab: 'myjobs',
            title: 'My Jobs',
            renderBody: () => {
                return this.renderMyJobsTab()
            }
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
                renderBody: () => {
                    return <UserJobs />
                }
            })
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
            })
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
        // let userRunTab;
        // let userJobsTab;
        // console.log('rendering, admin?', this.props.isAdmin);
        // if (this.props.isAdmin) {
        //     const tabLabel = (
        //         <span>
        //             User Run Summary <Icon type="unlock" />
        //         </span>
        //     );
        //     userRunTab = (
        //         <Tabs.TabPane tab={tabLabel} key="userRunSummary">
        //             <UserRunSummary />
        //         </Tabs.TabPane>
        //     );
        //     const userJobsTabLabel = (
        //         <span>
        //             User Jobs <Icon type="unlock" />
        //         </span>
        //     );
        //     userJobsTab = (
        //         <Tabs.TabPane tab={userJobsTabLabel} key="userJobs">
        //             <UserJobs />
        //         </Tabs.TabPane>
        //     );
        // }

        // FIXME: The animated flag is set to false below because for some reason antd (on safari at least) is not
        // correctly rendering any tab other than the first one with animation enabled (which is default).
        // Please investigate and either find what we have done wrong or antd has.
        // console.log('default active tab key?', this.state.defaultActiveTabKey);
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
