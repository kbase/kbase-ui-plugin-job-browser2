import React from 'react';

import { UserRunSummaryStat, SearchState, UserRunSummaryQuery } from '../../redux/store';
import { Table, Form, Input, Button, Tooltip } from 'antd';

export interface UserRunSummaryProps {
    searchState: SearchState;
    userRunSummary: Array<UserRunSummaryStat>;
    search: (query: UserRunSummaryQuery) => void;
}

interface UserRunSummaryState {}

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
    renderTable() {
        return (
            <Table<UserRunSummaryStat>
                dataSource={this.props.userRunSummary}
                loading={this.props.searchState === SearchState.SEARCHING}
                rowKey={(stat: UserRunSummaryStat) => {
                    return stat.username + '.' + stat.appId;
                }}
                pagination={{ position: 'bottom', showSizeChanger: true }}
                size="small"
                className="PreciseTable"
            >
                <Table.Column
                    title="User"
                    dataIndex="username"
                    key="username"
                    width="30%"
                    render={(username: string, stat: UserRunSummaryStat) => {
                        return (
                            <Tooltip title={username}>
                                <a href={`#people/${username}`} target="_parent">
                                    {username}
                                </a>
                            </Tooltip>
                        );
                    }}
                    sorter={(a: UserRunSummaryStat, b: UserRunSummaryStat) => {
                        return a.username.localeCompare(b.username);
                    }}
                />
                <Table.Column
                    title="Module"
                    dataIndex="moduleId"
                    key="moduleId"
                    width="30%"
                    render={(moduleId: string) => {
                        return (
                            <Tooltip title={moduleId}>
                                <a href={`#catalog/module/${moduleId}`} target="_parent">
                                    {moduleId}
                                </a>
                            </Tooltip>
                        );
                    }}
                    sorter={(a: UserRunSummaryStat, b: UserRunSummaryStat) => {
                        return a.moduleId.localeCompare(b.moduleId);
                    }}
                />
                <Table.Column
                    title="Function"
                    dataIndex="functionId"
                    key="functionId"
                    width="30%"
                    render={(functionId: string, stat: UserRunSummaryStat) => {
                        return (
                            <Tooltip title={functionId}>
                                <a href={`#catalog/apps/${stat.appId}`} target="_parent">
                                    {functionId}
                                </a>
                            </Tooltip>
                        );
                    }}
                    sorter={(a: UserRunSummaryStat, b: UserRunSummaryStat) => {
                        return a.functionId.localeCompare(b.functionId);
                    }}
                />
                <Table.Column
                    title="Runs"
                    dataIndex="runCount"
                    key="runCount"
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
    render() {
        return (
            <div>
                <div>{this.renderControlBar()}</div>
                <div> {this.renderTable()}</div>
            </div>
        );
    }
}
