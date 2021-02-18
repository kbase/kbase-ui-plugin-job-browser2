
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import Component from './data';
import { StoreState } from '../../../redux/store';

export interface OwnProps { }

interface StateProps {
    token: string;
    username: string;
    userProfileServiceURL: string;
}

interface DispatchProps {
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        auth: { userAuthorization },
        app: {
            config: {
                services: {
                    UserProfile: { url: userProfileServiceURL },
                }
            }
        }
    } = state;

    if (!userAuthorization) {
        throw new Error('Invalid state: token required');
    }

    const { token, username } = userAuthorization;

    return { token, username, userProfileServiceURL };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {};
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Component);
