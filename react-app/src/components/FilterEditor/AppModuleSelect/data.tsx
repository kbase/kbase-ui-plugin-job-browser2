import React from 'react';
import View from './view';
import { OptionValue } from '../../../lib/types';
import { SERVICE_TIMEOUT } from '../../../constants';
import { AppModuleSelectProps } from './view';
import CatalogClient from '../../../lib/comm/coreServices/Catalog';

/* For Component */
export interface DataProps {
    token: string;
    username: string;
    catalogURL: string;
}

// type TheProps = Omit<DataProps & FilterEditorProps, "narratives">;
type TheProps = Omit<DataProps & AppModuleSelectProps, "options">;

interface DataState {
    options: Array<OptionValue<string>> | null;
}

export default class Data extends React.Component<TheProps, DataState> {
    constructor(props: TheProps) {
        super(props);
        this.state = {
            options: null
        };
    }

    async componentDidMount() {
        const options = await this.fetchOptions();
        this.setState({
            options
        });
    }

    async fetchOptions(): Promise<Array<OptionValue<string>>> {
        const { token, catalogURL } = this.props;
        const client = new CatalogClient({
            authorization: token,
            url: catalogURL,
            timeout: SERVICE_TIMEOUT
        });
        const modules = await client.list_basic_module_info({});
        const options = modules
            .map((module) => {
                const { module_name } = module;

                return {
                    value: module_name,
                    label: `${module_name}`
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