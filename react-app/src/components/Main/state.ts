import { Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
import Main from './view';
import { StoreState } from '../../redux/store';
import { sendTitle, setView, setParams } from '@kbase/ui-components';
import { Params } from '@kbase/ui-components/lib/redux/integration/store';

export interface OwnProps { }

export type MainParams = Params<'tab'>;

interface StateProps {
    isAdmin: boolean;
    params: MainParams;
    view: string;
}

interface DispatchProps {
    setTitle: (title: string) => void;
    setView: (view: string) => void;
    setParams: (params: MainParams) => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        views: {
            mainView: { isAdmin }
        },
        app: {
            runtime: {
                navigation: { view, params: rawParams }
            }
        }
    } = state;
    // TODO: call function to coerce raw params into typed params...
    const params: MainParams = (rawParams as unknown) as MainParams;
    return { isAdmin, view, params };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {
        setTitle: (title: string) => {
            dispatch(sendTitle(title) as any);
        },
        setView: (view: string) => {
            dispatch(setView(view) as any);
        },
        setParams: (params: MainParams) => {
            dispatch(setParams(params) as any);
        }
    };
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Main);
