
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import Component from './data';
import { StoreState } from '../../redux/store';
import { FilterSpec } from '../../lib/JobBrowserBFFClient';
/**
 * This interface describes a single option for the available job status filter options.
 *
 * Job status filter options are used to populate the checkboxgroup.
 * Note that the value of each option is a job status filter key.
 */


export type JobFilter = FilterSpec;

export interface OwnProps { }

interface StateProps {
    token: string;
    username: string;
    workspaceURL: string;
}

interface DispatchProps {
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        auth: { userAuthorization },
        app: {
            config: {
                services: {
                    Workspace: { url: workspaceURL },
                    // ServiceWizard: { url: serviceWizardURL }
                }
            }
        }
    } = state;

    if (!userAuthorization) {
        throw new Error('Invalid state: token required');
    }

    const { token, username } = userAuthorization;

    return { token, username, workspaceURL };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {};
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Component);
