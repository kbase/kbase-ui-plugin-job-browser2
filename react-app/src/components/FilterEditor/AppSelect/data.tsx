import React from 'react';
import View from './view';
import { OptionValue } from '../../../lib/types';
import { SERVICE_TIMEOUT } from '../../../constants';
import { AppSelectProps } from './view';
import NarrativeMethodStoreClient from '../../../lib/comm/coreServices/NarrativeMethodStore';

/* For Component */
export interface DataProps {
    token: string;
    username: string;
    nmsURL: string;
}

// type TheProps = Omit<DataProps & FilterEditorProps, "narratives">;
type TheProps = Omit<DataProps & AppSelectProps, "options">;

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
        const { token, nmsURL } = this.props;
        const client = new NarrativeMethodStoreClient({
            authorization: token,
            url: nmsURL,
            timeout: SERVICE_TIMEOUT
        });
        const apps = await client.list_methods({});
        const appOptions = apps
            .map((app) => {
                const { id, name, module_name } = app;

                return {
                    value: id,
                    label: `${name} (${module_name})`
                };
            })
            .sort((a, b) => {
                return a.label.localeCompare(b.label);
            });
        return appOptions;
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