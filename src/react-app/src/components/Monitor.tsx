import * as React from 'react';
import { Progress, Button } from 'antd';

const MONITORING_INTERVAL = 10000;
const MONITORING_STATUS_INTERVAL = 100;

export interface MonitorProps {
    startMonitoring: boolean;
    onPoll: () => void;
}

export interface MonitorState {
    /** Support for job monitoring */
    isMonitoring: boolean;

    /** Monitoring progress */
    monitoringStatusCount: number;
}

export default class Monitor extends React.Component<MonitorProps, MonitorState> {
    monitoringTimer: number | null;
    monitoringStatusTimer: number | null;

    constructor(props: MonitorProps) {
        super(props);

        this.monitoringTimer = null;
        this.monitoringStatusTimer = null;
        this.state = {
            isMonitoring: false,
            monitoringStatusCount: 0
        };
    }

    componentDidMount() {
        if (this.props.startMonitoring) {
            this.startMonitoring();
        }
    }

    componentWillUnmount() {
        this.stopMonitoring();
    }

    startMonitoring() {
        this.monitoringTimer = window.setInterval(() => {
            this.props.onPoll();
            this.setState({
                monitoringStatusCount: 0
            });
        }, MONITORING_INTERVAL);
        this.setState({
            monitoringStatusCount: 0,
            isMonitoring: true
        });
        this.monitoringStatusTimer = window.setInterval(() => {
            this.setState({
                monitoringStatusCount: this.state.monitoringStatusCount + 1
            });
        }, MONITORING_STATUS_INTERVAL);
    }

    stopMonitoring() {
        if (this.monitoringTimer) {
            window.clearInterval(this.monitoringTimer);
        }
        if (this.monitoringStatusTimer) {
            window.clearInterval(this.monitoringStatusTimer);
        }
        this.setState({
            monitoringStatusCount: 0,
            isMonitoring: false
        });
    }

    toggleMonitoring() {
        if (this.state.isMonitoring) {
            this.stopMonitoring();
        } else {
            this.startMonitoring();
        }
    }

    render() {
        let monitoringStatus;
        let label = 'Start Monitoring';
        let buttonType: 'default' | 'danger' = 'default';
        if (this.state.isMonitoring) {
            label = 'Stop Monitoring';
            buttonType = 'danger';
            const progressPercent =
                (100 * this.state.monitoringStatusCount) / (MONITORING_INTERVAL / MONITORING_STATUS_INTERVAL);
            monitoringStatus = (
                <span>
                    {' '}
                    <Progress percent={progressPercent} style={{ width: '10em' }} showInfo={false} />
                </span>
            );
        }
        return (
            <span>
                <Button onClick={this.toggleMonitoring.bind(this)} type={buttonType}>
                    {label}
                </Button>
                {monitoringStatus}
            </span>
        );
    }
}
