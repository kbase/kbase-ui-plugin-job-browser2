import React from 'react';
import { UserRunSummaryStat, SearchState, UserRunSummaryQuery } from '../../redux/store';
import { Table, Form, Input, Button, Tooltip } from 'antd';
import './style.css';

export interface UserRunSummaryProps {
    searchState: SearchState;
    userRunSummary: Array<UserRunSummaryStat>;
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
    renderTable() {
        return (
            <Table<UserRunSummaryStat>
                dataSource={this.props.userRunSummary}
                loading={this.props.searchState === SearchState.SEARCHING}
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
                    dataIndex="moduleName"
                    // key="moduleId"
                    width="30%"
                    render={(moduleName: string) => {
                        return (
                            <Tooltip title={moduleName}>
                                <a href={`#catalog/module/${moduleName}`} target="_parent">
                                    {moduleName}
                                </a>
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
                                <a href={`#catalog/apps/${stat.appId}`} target="_parent">
                                    {functionName}
                                </a>
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
    render() {
        return (
            <div className="UserRunSummary">
                {this.renderControlBar()}
                {this.renderTable()}
            </div>
        );
    }
}
