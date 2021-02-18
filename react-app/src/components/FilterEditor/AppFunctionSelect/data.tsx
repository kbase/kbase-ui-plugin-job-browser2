import React from 'react';
import View from './view';
import { SERVICE_TIMEOUT } from '../../../constants';
import { AppFunctionSelectProps } from './view';
import NarrativeMethodStoreClient from '../../../lib/comm/coreServices/NarrativeMethodStore';
import { OptionValue } from '../../../lib/types';

/* For Component */
export interface DataProps {
    token: string;
    username: string;
    nmsURL: string;
}

// type TheProps = Omit<DataProps & FilterEditorProps, "narratives">;
type TheProps = Omit<DataProps & AppFunctionSelectProps, "options">;

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
        const optionsMap = apps
            .reduce((options, app) => {
                const { id } = app;

                let [moduleId, functionId] = id.split('/');

                if (typeof functionId === 'undefined') {
                    functionId = moduleId;
                    moduleId = 'unknown';
                }

                const option = options.get(functionId);
                if (!option) {
                    const newOption = new Set([moduleId]);
                    options.set(functionId, newOption);
                } else {
                    option.add(moduleId);
                }

                return options;
            }, new Map<string, Set<string>>());

        const options = Array.from(optionsMap.entries())
            .map(([key, value]) => {
                return {
                    value: key,
                    label: `${key} (${Array.from(value.values()).join(', ')})`
                };
            })
            .sort((a, b) => {
                return a.label.localeCompare(b.label);
            });
        return options;
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