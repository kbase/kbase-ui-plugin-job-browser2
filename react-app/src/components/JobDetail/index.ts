import { Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
import JobLogState from './state';
import { StoreState } from '../../redux/store';

export interface OwnProps {
}

interface StateProps {
    token: string;
    njsURL: string;
    serviceWizardURL: string;
}

interface DispatchProps { }

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        auth: { userAuthorization },
        app: {
            config: {
                services: {
                    NarrativeJobService: { url: njsURL },
                    ServiceWizard: { url: serviceWizardURL }
                }
            }
        }
    } = state;

    let token;
    if (!userAuthorization) {
        throw new Error('Invalid state: token required');
    } else {
        token = userAuthorization.token;
    }

    return { token, njsURL, serviceWizardURL };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {};
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(JobLogState);
