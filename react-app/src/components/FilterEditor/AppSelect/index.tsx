
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import Component from './data';
import { StoreState } from '../../../redux/store';

export interface OwnProps { }

interface StateProps {
    token: string;
    username: string;
    nmsURL: string;
}

interface DispatchProps {
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        auth: { userAuthorization },
        app: {
            config: {
                services: {
                    NarrativeMethodStore: { url: nmsURL },
                }
            }
        }
    } = state;

    if (!userAuthorization) {
        throw new Error('Invalid state: token required');
    }

    const { token, username } = userAuthorization;

    return { token, username, nmsURL };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {};
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Component);
