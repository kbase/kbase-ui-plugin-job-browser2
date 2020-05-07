import { Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
import Data from './data';

import {
    StoreState
} from '../../redux/store';

export interface OwnProps {
}

interface StateProps {
    token: string;
    username: string;
    serviceWizardURL: string;
}

interface DispatchProps {
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        auth: { userAuthorization },
        app: {
            config: {
                services: {
                    ServiceWizard: { url: serviceWizardURL }
                }
            }
        }
    } = state;

    if (!userAuthorization) {
        throw new Error('Not authorized!');
    }

    const { token, username } = userAuthorization;

    return {
        token, username,
        serviceWizardURL
    };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {};
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Data);
