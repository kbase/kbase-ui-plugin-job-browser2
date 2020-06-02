
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import Component from './data';
import { StoreState } from '../../../redux/store';
import { DynamicServiceConfig } from '@kbase/ui-components/lib/redux/integration/store';

export interface OwnProps { }

interface StateProps {
    token: string;
    serviceWizardURL: string;
    jobBrowserBFFConfig: DynamicServiceConfig;
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
                },
                dynamicServices: {
                    JobBrowserBFF: jobBrowserBFFConfig
                }
            }
        }
    } = state;

    if (!userAuthorization) {
        throw new Error('Invalid state: token required');
    }

    const { token } = userAuthorization;

    return { token, serviceWizardURL, jobBrowserBFFConfig };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {};
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Component);
