import React from 'react';
import View from './view';
import { OptionValue } from '../../../lib/types';
import { WorkspaceClient } from '../../../lib/comm/coreServices/Workspace';
import { SERVICE_TIMEOUT } from '../../../constants';
import { NarrativeSelectProps } from './view';

/* For Component */
export interface DataProps {
    token: string;
    username: string;
    workspaceURL: string;
}

// type TheProps = Omit<DataProps & FilterEditorProps, "narratives">;
type TheProps = Omit<DataProps & NarrativeSelectProps, "narratives">;

interface DataState {
    narratives: Array<OptionValue<number>> | null;
}

export default class Data extends React.Component<TheProps, DataState> {
    stopped: boolean;
    constructor(props: TheProps) {
        super(props);
        this.state = {
            narratives: null
        };
        this.stopped = false;
    }

    componentWillUnmount() {
        this.stopped = true;
    }

    async componentDidMount() {
        const narratives = await this.fetchNarratives();
        if (!this.stopped) {
            this.setState({
                narratives
            });
        }
    }

    async fetchNarratives(): Promise<Array<OptionValue<number>>> {
        const { token, workspaceURL } = this.props;
        const client = new WorkspaceClient({
            authorization: token,
            url: workspaceURL,
            timeout: SERVICE_TIMEOUT
        });
        const workspaces = await client.list_workspace_info({});
        const narratives = workspaces
            .filter((workspace) => {
                const metadata = workspace[8];
                const { narrative, is_temporary } = metadata;
                if (!narrative) {
                    return false;
                }
                if (is_temporary === 'true') {
                    return false;
                }
                return true;
            })
            .map((workspace) => {
                const [id, , , , , , , , metadata] = workspace;
                return {
                    value: id,
                    label: metadata.narrative_nice_name
                };
            })
            .sort((a, b) => {
                return a.label.localeCompare(b.label);
            });
        return narratives;
    }

    render() {
        if (this.state.narratives) {
            return <View
                onChange={this.props.onChange}
                narratives={this.state.narratives}
                defaultValue={this.props.defaultValue}
            />;
        } else {
            return "loading...";
        }

    }
}