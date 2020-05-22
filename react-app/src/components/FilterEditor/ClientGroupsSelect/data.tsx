import React from 'react';
import View from './view';
import { OptionValue } from '../../../lib/types';
import { SERVICE_TIMEOUT } from '../../../constants';
import { ClientGroupSelectProps } from './view';
import JobBrowserBFFClient from '../../../lib/JobBrowserBFFClient';

/* For Component */
export interface DataProps {
    token: string;
    serviceWizardURL: string;
}

// type TheProps = Omit<DataProps & FilterEditorProps, "narratives">;
type TheProps = Omit<DataProps & ClientGroupSelectProps, "options">;

interface DataState {
    options: Array<OptionValue<string>> | null;
}

export default class Data extends React.Component<TheProps, DataState> {
    stopped: boolean;
    constructor(props: TheProps) {
        super(props);
        this.state = {
            options: null
        };
        this.stopped = false;
    }

    componentWillUnmount() {
        this.stopped = true;
    }

    async componentDidMount() {
        const options = await this.fetchOptions();
        if (!this.stopped) {
            this.setState({
                options
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

    render() {
        if (this.state.options) {
            return <View
                onChange={this.props.onChange}
                options={this.state.options}
                defaultValue={this.props.defaultValue}
            />;
        } else {
            return "loading...";
        }

    }
}