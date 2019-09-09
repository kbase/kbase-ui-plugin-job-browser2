import React from 'react';
import './style.css';
import { Job, JobStatus } from '../../redux/store';
import { JobLogLine, JobLog } from './state';
import { Table, Tooltip, Empty, Button, Dropdown, Menu, Spin } from 'antd';
import { ClickParam } from 'antd/lib/menu';
import Papa from 'papaparse';
import ButtonGroup from 'antd/lib/button/button-group';

enum PlayState {
    NONE,
    PLAYING,
    PAUSED,
    DISABLED
}

export interface JobLogProps {
    job: Job;
    log: JobLog;
}

interface JobLogState {
    playState: PlayState;
    isPaused: boolean;
}

export default class JobLogs extends React.Component<JobLogProps, JobLogState> {
    playLogTimer: number;
    bodyRef: React.RefObject<HTMLDivElement>
    // a hack to detect state change... 
    currentJobStatus: JobStatus | null;

    constructor(params: JobLogProps) {
        super(params);
        this.playLogTimer = 0;
        this.bodyRef = React.createRef();
        this.currentJobStatus = null;
        this.state = {
            playState: PlayState.NONE,
            isPaused: false
        }
    }
    componentDidMount() {
        this.currentJobStatus = this.props.job.status;

        // if (this.state.playState !== PlayState.PLAYING) {
        //     return;
        // }
        if (this.state.isPaused) {
            return;
        }
        if (!this.isActive()) {
            return;
        }
        this.scrollToBottom();
    }
    scrollToBottom() {
        if (this.bodyRef.current === null) {
            return;
        }
        // console.log('scroll to bottom!', this.bodyRef.current.scrollTop, this.bodyRef.current.scrollHeight, this.bodyRef.current.clientHeight);
        this.bodyRef.current.scrollTop = this.bodyRef.current.scrollHeight;
    }
    componentDidUpdate() {
        const lastJobStatus = this.currentJobStatus;
        this.currentJobStatus = this.props.job.status;
        // if (this.state.playState !== PlayState.PLAYING) {
        //     return;
        // }
        if (this.state.isPaused) {
            return;
        }
        if (!this.isActive()) {
            if (lastJobStatus === JobStatus.RUNNING &&
                this.props.job.status === JobStatus.RUNNING) {
                return;
            }
        }
        this.scrollToBottom();
    }
    isActive() {
        return this.props.job.status === JobStatus.QUEUED ||
            this.props.job.status === JobStatus.RUNNING;
    }
    renderLastLine() {
        let message;

        if (this.isActive()) {
            message = <span>
                Polling for additional log entries...{' '}
                <Spin size="small" />
            </span>
        } else {
            message = <div style={{ textAlign: 'center', fontStyle: 'italic' }}>Log complete</div>
        }
        return (
            <div className="FlexTable-row" key='END' style={{ backgroundColor: 'rgba(200, 200, 200, 0.5)' }} data-end="end">
                <div className="FlexTable-col"></div>
                <div className="FlexTable-col">{message}</div>
            </div>
        )
    }
    renderJobLog() {
        const lines = this.props.log;
        if (lines.length === 0) {
            return (
                <Empty />
            )
        }
        const rows = lines.map((line) => {
            const rowStyle: React.CSSProperties = {};
            if (line.isError) {
                rowStyle.color = 'red';
            }
            return <div className="FlexTable-row" style={rowStyle} key={line.lineNumber}>
                <div className="FlexTable-col">
                    {line.lineNumber}
                </div>
                <div className="FlexTable-col">
                    {line.line}
                </div>
            </div>
        })
        rows.push(
            this.renderLastLine()
        )
        return (
            <div className="FlexTable" key="log">
                <div className="FlexTable-header">
                    <div className="FlexTable-row">
                        <div className="FlexTable-col">Line #</div>
                        <div className="FlexTable-col">Log line</div>
                    </div>
                </div>
                <div className="FlexTable-body" ref={this.bodyRef}>
                    {rows}
                </div>
            </div>
        )
    }

    renderJobLogRow() {

    }
    renderJobLogLines() {
        return (
            <Table
                dataSource={this.props.log}
                size="small"
                // scroll={{ y: 400 }}
                rowKey={(logLine: JobLogLine) => {
                    return String(logLine.lineNumber);
                }}
                // pagination={{ position: 'top', showSizeChanger: true }}
                pagination={false}
                scroll={{ y: '100%' }}
                rowClassName={(line: JobLogLine) => {
                    if (line.isError) {
                        return 'JobLog-errorRow';
                    } else {
                        return 'JobLog-normalRow';
                    }
                }}
            >
                <Table.Column
                    title="Row"
                    dataIndex="lineNumber"
                    key="lineNumber"
                    width="8%"
                    render={(lineNumber: number, logLine: JobLogLine) => {
                        const numberDisplay = new Intl.NumberFormat('en-US', { useGrouping: true }).format(lineNumber);
                        if (logLine.isError) {
                            return <span className="JobLog-errorText">{numberDisplay}</span>;
                        }
                        return numberDisplay;
                    }}
                    sorter={(a: JobLogLine, b: JobLogLine) => {
                        return a.lineNumber - b.lineNumber;
                    }}
                />
                <Table.Column
                    title="Log line"
                    dataIndex="line"
                    key="line"
                    width="92%"
                    render={(line: string, logLine: JobLogLine) => {
                        let row;
                        if (logLine.isError) {
                            row = <span className="JobLog-errorText">{line}</span>;
                        } else {
                            row = <span>{line}</span>;
                        }
                        return <Tooltip title={line}>{row}</Tooltip>;
                    }}
                />
            </Table>
        );
    }
    downloadLog(type: string, log: JobLog) {
        function download(filename: string, contentType: string, content: string) {
            const downloadLink = document.createElement('a');
            const downloadContent = new Blob([content]);
            downloadLink.href = URL.createObjectURL(downloadContent);
            downloadLink.download = filename;
            downloadLink.style.visibility = 'none';
            downloadLink.type = contentType;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(downloadLink.href);
        }
        function logToCSV(log: JobLog): string {
            return Papa.unparse(log);
        }
        function logToTSV(log: JobLog): string {
            return Papa.unparse(log, {
                delimiter: '\t'
            });
        }
        function logToJSON(log: JobLog): string {
            return JSON.stringify(log);
        }
        function logToText(log: JobLog): string {
            return log.map((line) => {
                return line.line;
            }).join('\n');
        }

        let contentType: string;
        let content: string;
        switch (type) {
            case 'tsv':
                contentType = 'application/octet-stream';
                content = logToTSV(log);
                break;
            case 'json':
                contentType = 'application/octet-stream';
                content = logToJSON(log);
                break;
            case 'text':
                contentType = 'text/plain';
                content = logToText(log);
                break;
            default:
            case 'csv':
                contentType = 'application/octet-stream';
                content = logToCSV(log);
                break;
        }

        download('job-log.' + type, contentType, content)
    }

    onMenuClick(param: ClickParam | undefined) {
        if (!param) {
            return
        }
        this.downloadLog(param.key, this.props.log);
    }

    onPlayLog() {
        // this.props.updateJobLog();
        this.scrollToBottom();
        this.setState({
            playState: PlayState.PLAYING,
            isPaused: false
        })
    }

    onPauseLog() {
        this.setState({
            playState: PlayState.PAUSED,
            isPaused: true
        })
    }

    renderPlayPauseTooltips() {
        let playTooltip: string;
        let pauseTooltip: string;
        const isPaused = this.state.isPaused;

        switch (this.props.job.status) {
            case JobStatus.RUNNING:
                if (isPaused) {
                    playTooltip = 'Click to automatically scroll to the bottom of the logs when new entries arrive';
                    pauseTooltip = 'Automatic scrolling is already paused';
                } else {
                    playTooltip = 'Automatic scrolling is already active';
                    pauseTooltip = 'Click to pause automatic scrolling to the bottom of the logs when new entries arrive';
                }
                break;
            case JobStatus.QUEUED:
            case JobStatus.FINISHED:
            case JobStatus.ERRORED:
            case JobStatus.CANCELED_QUEUED:
            case JobStatus.CANCELED_RUNNING:
            default:
                playTooltip = 'Log playing only available when the job is running';
                pauseTooltip = 'Log playing only available when the job is running';
                break;

        }
        return [playTooltip, pauseTooltip];
    }

    renderPlayPause() {
        let irrelevant: boolean;

        // Does the job status make log playing irrelevant.
        switch (this.props.job.status) {
            case JobStatus.QUEUED:
                irrelevant = true;
                break;
            case JobStatus.RUNNING:
                irrelevant = false;
                break;
            case JobStatus.FINISHED:
            case JobStatus.ERRORED:
            case JobStatus.CANCELED_QUEUED:
            case JobStatus.CANCELED_RUNNING:
            default:
                irrelevant = true;
        }

        const [playTooltip, pauseTooltip] = this.renderPlayPauseTooltips();

        return (
            <ButtonGroup >
                <Tooltip title={playTooltip}>
                    <Button icon="caret-right" disabled={irrelevant || !this.state.isPaused} onClick={this.onPlayLog.bind(this)} />
                </Tooltip>
                <Tooltip title={pauseTooltip}>
                    <Button icon="pause" disabled={irrelevant || this.state.isPaused} onClick={this.onPauseLog.bind(this)} />
                </Tooltip>
            </ButtonGroup>
        )
    }
    renderToolbar() {
        const disabled = this.props.log.length === 0;
        const menu = (
            <Menu onClick={this.onMenuClick.bind(this)}>
                <Menu.Item key="csv" disabled={disabled}>CSV</Menu.Item>
                <Menu.Item key="tsv" disabled={disabled}>TSV</Menu.Item>
                <Menu.Item key="json" disabled={disabled}>JSON</Menu.Item>
                <Menu.Item key="text" disabled={disabled}>TEXT</Menu.Item>
            </Menu>
        )
        return (
            <div key="toolbar">
                <Dropdown overlay={menu}>
                    <Button icon="download"></Button>
                </Dropdown>
                {' '}
                {this.renderPlayPause()}
            </div>
        )
    }
    render() {
        return <div className="JobLog">
            {this.renderToolbar()}
            {this.renderJobLog()}
        </div>
    }
    // render() {
    //     return this.renderJobLog();
    // }
}
