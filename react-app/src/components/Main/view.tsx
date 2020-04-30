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
                return <MyJobs />;
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
                return <PublicAppStats />;
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

    renderTabs() {
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
