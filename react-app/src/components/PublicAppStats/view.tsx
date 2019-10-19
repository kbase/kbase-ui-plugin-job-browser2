import React from 'react';
import { AppStat, PublicAppStatsQuery, SearchState } from '../../redux/store';
import { Table, Form, Progress, Input, Button, Tooltip } from 'antd';
import { NiceTimeDuration } from '@kbase/ui-components';
import { PaginationConfig, SorterResult } from 'antd/lib/table';
import './style.css';

export interface PublicAppStatsProps {
    searchState: SearchState;
    appStats: Array<AppStat>;
    onSearch: (query: PublicAppStatsQuery) => void;
}

interface PublicAppStatsState {
    appStats: Array<AppStat>;
}

export default class PublicAppStats extends React.Component<PublicAppStatsProps, PublicAppStatsState> {
    currentQuery: string;
    constructor(props: PublicAppStatsProps) {
        super(props);
        this.currentQuery = '';
    }
    componentDidMount() {
        this.props.onSearch({
            query: this.currentQuery
        });
    }
    onSubmitSearch(event: React.FormEvent) {
        event.preventDefault();
        this.props.onSearch({
            query: this.currentQuery
        });
    }
    onChangeQuery(event: React.ChangeEvent<HTMLInputElement>) {
        this.currentQuery = event.target.value;
    }
    renderControlBar() {
        return (
            <Form layout="inline" onSubmit={this.onSubmitSearch.bind(this)}>
                <Form.Item>
                    <Input
                        defaultValue={this.currentQuery}
                        placeholder="Search App Stats (leave empty for all)"
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
    onTableChange(pagination: PaginationConfig, filters: any, sorter: SorterResult<AppStat>) { }
    renderAppStatsTable() {
        return (
            <Table<AppStat>
                dataSource={this.props.appStats}
                loading={this.props.searchState === SearchState.SEARCHING}
                rowKey={(stat: AppStat) => {
                    return stat.appId;
                }}
                pagination={{ position: 'bottom', showSizeChanger: true }}
                // pagination={false}
                // scroll={{ y: '100%' }}
                size="small"
                className="PreciseTable ScrollingFlexTable"
                onChange={this.onTableChange}
            >
                <Table.Column
                    title="Module"
                    dataIndex="moduleId"
                    key="moduleId"
                    width="25%"
                    render={(moduleId: string, stat: AppStat) => {
                        return (
                            <Tooltip title={stat.moduleTitle}>
                                <a href={`#catalog/module/${moduleId}`}>{stat.moduleTitle}</a>
                            </Tooltip>
                        );
                    }}
                    sorter={(a: AppStat, b: AppStat) => {
                        return a.moduleTitle.localeCompare(b.moduleTitle);
                    }}
                    defaultSortOrder="ascend"
                />
                <Table.Column
                    title="Function"
                    dataIndex="functionId"
                    key="functionId"
                    width="25%"
                    render={(functionId: string, stat: AppStat) => {
                        return (
                            <Tooltip title={stat.functionTitle}>
                                <a href={`#catalog/apps/${stat.moduleId}/${stat.functionId}`}>
                                    {stat.functionTitle}
                                </a>
                            </Tooltip>
                        );
                    }}
                    sorter={(a: AppStat, b: AppStat) => {
                        return a.functionTitle.localeCompare(b.functionTitle);
                    }}
                />
                <Table.Column
                    title="Runs"
                    dataIndex="runCount"
                    key="runCount"
                    width="5%"
                    align="right"
                    render={(runCount: number) => {
                        return (
                            <div className="NumericColumn">
                                {new Intl.NumberFormat('en-US', {
                                    useGrouping: true
                                }).format(runCount)}
                            </div>
                        );
                    }}
                    sorter={(a: AppStat, b: AppStat) => {
                        return a.runCount - b.runCount;
                    }}
                />
                <Table.Column
                    title="Errors"
                    dataIndex="errorCount"
                    key="errorCount"
                    width="5%"
                    align="right"
                    render={(errorCount: number) => {
                        return (
                            <div className="NumericColumn">
                                {new Intl.NumberFormat('en-US', {
                                    useGrouping: true
                                }).format(errorCount)}
                            </div>
                        );
                    }}
                    sorter={(a: AppStat, b: AppStat) => {
                        return a.errorCount - b.errorCount;
                    }}
                />
                <Table.Column
                    title="Success"
                    dataIndex="successRate"
                    key="successRate"
                    width="10%"
                    render={(successRate: number) => {
                        return (
                            <Progress
                                percent={successRate * 100}
                                format={(percent: number | undefined) => {
                                    return new Intl.NumberFormat('en-US', {
                                        style: 'percent'
                                    }).format(successRate);
                                }}
                            />
                        );
                    }}
                    sorter={(a: AppStat, b: AppStat) => {
                        return a.successRate - b.successRate;
                    }}
                />
                <Table.Column
                    title="Avg Run"
                    dataIndex="averageRunTime"
                    key="averageRunTime"
                    width="10%"
                    render={(averageRunTime: number) => {
                        return <NiceTimeDuration precision={2} duration={averageRunTime * 1000} />;
                    }}
                    sorter={(a: AppStat, b: AppStat) => {
                        return a.averageRunTime - b.averageRunTime;
                    }}
                />
                <Table.Column
                    title="Avg Queue"
                    dataIndex="averageQueueTime"
                    key="averageQueueTime"
                    width="10%"
                    render={(averageQueueTime: number) => {
                        return <NiceTimeDuration precision={2} duration={averageQueueTime * 1000} />;
                    }}
                    sorter={(a: AppStat, b: AppStat) => {
                        return a.averageQueueTime - b.averageQueueTime;
                    }}
                />
                <Table.Column
                    title="Total Run"
                    dataIndex="totalRunTime"
                    key="totalRunTime"
                    width="10%"
                    render={(totalRunTime: number) => {
                        return <NiceTimeDuration precision={2} duration={totalRunTime * 1000} />;
                    }}
                    sorter={(a: AppStat, b: AppStat) => {
                        return a.totalRunTime - b.totalRunTime;
                    }}
                />
            </Table>
        );
    }
    render() {
        return <div className="PublicAppStats">
            {this.renderControlBar()}
            {this.renderAppStatsTable()}
        </div>;
    }
}
