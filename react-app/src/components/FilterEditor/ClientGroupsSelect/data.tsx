import React from 'react';
import View from './view';
import { OptionValue } from '../../../lib/types';
import { SERVICE_TIMEOUT } from '../../../constants';
import { ClientGroupSelectProps } from './view';
import JobBrowserBFFClient from '../../../lib/JobBrowserBFFClient';
import { AsyncProcessState, AsyncProcess } from '../../Table';
import { Spin, Alert } from 'antd';
import { UIError } from '../../../redux/types/error';

/* For Component */
export interface DataProps {
    token: string;
    serviceWizardURL: string;
}

// type TheProps = Omit<DataProps & FilterEditorProps, "narratives">;
type TheProps = Omit<DataProps & ClientGroupSelectProps, "options">;

interface DataState {
    // options: Array<OptionValue<string>> | null;
    process: AsyncProcess<Array<OptionValue<string>>>;
}

export default class Data extends React.Component<TheProps, DataState> {
    stopped: boolean;
    constructor(props: TheProps) {
        super(props);
        this.state = {
            process: {
                status: AsyncProcessState.NONE
            }
            // options: null,
            // status: AsyncProcessState.NONE
        };
        this.stopped = false;
    }

    componentWillUnmount() {
        this.stopped = true;
    }

    async componentDidMount() {
        try {
            const options = await this.fetchOptions();
            if (!this.stopped) {
                this.setState({
                    process: {
                        status: AsyncProcessState.SUCCESS,
                        result: options
                    }
                });
            }
        } catch (ex) {
            // TOODO: catch and propagate JSONRPC errors
            this.setState({
                process: {
                    status: AsyncProcessState.ERROR,
                    error: {
                        code: 0,
                        message: ex.message
                    }
                }
            });
        }
    }

    async fetchOptions(): Promise<Array<OptionValue<string>>> {
        const { token, serviceWizardURL } = this.props;
        const client = new JobBrowserBFFClient({
            token,
            url: serviceWizardURL,
            timeout: SERVICE_TIMEOUT
        });
        const clientGroups = await client.get_client_groups();
        const clientGroupOptions = clientGroups.client_groups
            .map((clientGroup) => {
                return {
                    value: clientGroup,
                    label: clientGroup
                };
            })
            .sort((a, b) => {
                return a.label.localeCompare(b.label);
            });
        return clientGroupOptions;
    }

    renderLoading() {
        return <Spin />;
    }

    renderError(error: UIError) {
        return <Alert type="error" message={error.message} />;
    }

    render() {
        switch (this.state.process.status) {
            case AsyncProcessState.NONE:
            case AsyncProcessState.PROCESSING:
                return this.renderLoading();
            case AsyncProcessState.SUCCESS:
                return <View
                    onChange={this.props.onChange}
                    options={this.state.process.result}
                    defaultValue={this.props.defaultValue}
                />;
            case AsyncProcessState.ERROR:
                return this.renderError(this.state.process.error);
        }
    }
}