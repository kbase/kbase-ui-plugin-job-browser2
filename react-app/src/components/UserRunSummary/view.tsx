import React from 'react';
import { } from '../../redux/store';
import { Table, Form, Input, Button, Tooltip, Spin, Alert } from 'antd';
import './style.css';

import { SearchState } from '../../redux/store/base';
import { UserRunSummaryStat, UserRunSummaryQuery, UserRunSummaryViewData, UserRunSummaryViewDataError, UserRunSummaryViewDataSearched, UserRunSummaryViewDataSearching } from '../../redux/store/UserRunSummary';

import UILink from '../UILink';


export interface UserRunSummaryProps {
    view: UserRunSummaryViewData;
    // searchState: SearchState;
    // userRunSummary: Array<UserRunSummaryStat>;
    search: (query: UserRunSummaryQuery) => void;
}

interface UserRunSummaryState { }

export default class UserRunSummary extends React.Component<UserRunSummaryProps, UserRunSummaryState> {
    currentQuery: UserRunSummaryQuery;
    constructor(props: UserRunSummaryProps) {
        super(props);
        this.currentQuery = {
            query: ''
        };
    }
    componentDidMount() {
        this.props.search(this.currentQuery);
    }
    onSubmitSearch(event: React.FormEvent) {
        event.preventDefault();
        this.props.search(this.currentQuery);
    }
    onChangeQuery(event: React.ChangeEvent<HTMLInputElement>) {
        this.currentQuery.query = event.target.value;
    }
    renderControlBar() {
        return (
            <Form layout="inline" onSubmit={this.onSubmitSearch.bind(this)}>
                <Form.Item>
                    <Input
                        defaultValue={this.currentQuery.query}
                        placeholder="Search (leave empty for all)"
                        style={{ width: '20em' }}
                        onChange={this.onChangeQuery.bind(this)}
                    />
                </Form.Item>
                <Form.Item>
                    <Button icon="search" type="primary" htmlType="submit" />
                </Form.Item>
            </Form>
        );
    }
    renderTable(view: UserRunSummaryViewDataSearched | UserRunSummaryViewDataSearching) {
        return (
            <Table<UserRunSummaryStat>
                dataSource={view.userRunSummary}
                loading={view.searchState === SearchState.SEARCHING}
                rowKey={(stat: UserRunSummaryStat) => {
                    return [
                        stat.username,
                        stat.appId,
                        stat.moduleName,
                        stat.functionName
                    ].join(':');
                }}
                pagination={{ position: 'bottom', showSizeChanger: true }}
                // pagination={false}
                // scroll={{ y: '100%' }}
                size="small"
                className="PreciseTable ScrollingFlexTable"
            >
                <Table.Column
                    title="User"
                    dataIndex="username"
                    // key="username"
                    width="30%"
                    render={(username: string, stat: UserRunSummaryStat) => {
                        return (
                            <Tooltip title={username}>
                                <UILink path={`people/${username}`}
                                    openIn='same-window'>
                                    {username}
                                </UILink>
                            </Tooltip>
                        );
                    }}
                    sorter={(a: UserRunSummaryStat, b: UserRunSummaryStat) => {
                        return a.username.localeCompare(b.username);
                    }}
                />
                <Table.Column
                    title="Module"
                    dataIndex="moduleName"
                    // key="moduleId"
                    width="30%"
                    render={(moduleName: string) => {
                        return (
                            <Tooltip title={moduleName}>
                                <UILink path={`catalog/modules/${moduleName}`}
                                    openIn='same-window'>
                                    {moduleName}
                                </UILink>
                            </Tooltip>
                        );
                    }}
                    sorter={(a: UserRunSummaryStat, b: UserRunSummaryStat) => {
                        return a.moduleName.localeCompare(b.moduleName);
                    }}
                />
                <Table.Column
                    title="Function"
                    dataIndex="functionName"
                    // key="functionId"
                    width="30%"
                    render={(functionName: string, stat: UserRunSummaryStat) => {
                        return (
                            <Tooltip title={functionName}>
                                <UILink path={`catalog/apps/${stat.appId}`}
                                    openIn='same-window'>
                                    {functionName}
                                </UILink>
                            </Tooltip>
                        );
                    }}
                    sorter={(a: UserRunSummaryStat, b: UserRunSummaryStat) => {
                        return a.functionName.localeCompare(b.functionName);
                    }}
                />
                <Table.Column
                    title="Runs"
                    dataIndex="runCount"
                    // key="runCount"
                    width="10%"
                    align="right"
                    render={(runCount: number, stat: UserRunSummaryStat) => {
                        return (
                            <div className="NumericColumn">
                                {Intl.NumberFormat('en-US', {
                                    useGrouping: true
                                }).format(runCount)}
                            </div>
                        );
                    }}
                    sorter={(a: UserRunSummaryStat, b: UserRunSummaryStat) => {
                        return a.runCount - b.runCount;
                    }}
                    defaultSortOrder="descend"
                />
            </Table>
        );
    }

    renderLoading() {
        return <Spin />;
    }

    renderError(view: UserRunSummaryViewDataError) {
        return <Alert type="error" message={view.error.message} />;
    }

    renderViewState() {
        const view = this.props.view;
        switch (view.searchState) {
            case SearchState.NONE:
            case SearchState.INITIAL_SEARCHING:
                return this.renderLoading();
            case SearchState.SEARCHING:
            case SearchState.SEARCHED:
                return this.renderTable(view);
            case SearchState.ERROR:
                return this.renderError(view);
        }
    }

    render() {
        return (
            <div className="UserRunSummary">
                {this.renderControlBar()}
                {this.renderViewState()}
            </div>
        );
    }
}
