import React from 'react';
import View, { UserSelectProps } from './view';
import { OptionValue } from '../../../lib/types';
// import { SERVICE_TIMEOUT } from '../../../constants';
import { UserProfileClient } from '../../../lib/comm/coreServices/UserProfile';

/* For Component */
export interface DataProps {
    token: string;
    username: string;
    userProfileServiceURL: string;
}

// type TheProps = Omit<DataProps & FilterEditorProps, "narratives">;
type TheProps = Omit<DataProps & UserSelectProps, "options" | "search">;

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
        // const options = await this.fetchOptions();
        if (!this.stopped) {
            this.setState({
                options: []
            });
        }
    }

    async search(term: string) {
        const { token, userProfileServiceURL } = this.props;
        const client = new UserProfileClient({
            url: userProfileServiceURL,
            authorization: token,
            timeout:  10000
        });
        const users = await client.searchUsers(term);
        const options = users
            .map(({username, realname}) => {
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