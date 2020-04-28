import React from 'react';
import View, { UserSelectProps } from './view';
import { OptionValue } from '../../../lib/types';
// import { SERVICE_TIMEOUT } from '../../../constants';
import AuthClient from '../../../lib/comm/coreServices/Auth2';

/* For Component */
export interface DataProps {
    token: string;
    username: string;
    authURL: string;
}

// type TheProps = Omit<DataProps & FilterEditorProps, "narratives">;
type TheProps = Omit<DataProps & UserSelectProps, "options" | "search">;

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
        // const options = await this.fetchOptions();
        this.setState({
            options: []
        });
    }

    async search(term: string) {
        const { token, authURL } = this.props;
        const client = new AuthClient({
            url: authURL,
            authorization: token
        });
        const users = await client.searchUsers(term);
        const options = Array.from(Object.entries(users))
            .map(([username, realname]) => {

                return {
                    value: username,
                    label: `${realname} (${username})`
                };
            })
            .sort((a, b) => {
                return a.label.localeCompare(b.label);
            });
        this.setState({
            options
        });
    }

    render() {
        if (this.state.options) {
            return <View
                changed={this.props.changed}
                search={this.search.bind(this)}
                options={this.state.options}
                defaultValue={this.props.defaultValue}
            />;
        } else {
            return "loading...";
        }

    }
}