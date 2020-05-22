
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import Component from './data';
import { StoreState } from '../../../redux/store';

export interface OwnProps { }

interface StateProps {
    token: string;
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
                    ServiceWizard: { url: serviceWizardURL },
                }
            }
        }
    } = state;

    if (!userAuthorization) {
        throw new Error('Invalid state: token required');
    }

    const { token } = userAuthorization;

    return { token, serviceWizardURL };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {};
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Component);
