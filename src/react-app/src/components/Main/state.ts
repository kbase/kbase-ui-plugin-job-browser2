import { Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
import Main from './view';
import { StoreState } from '../../redux/store';

export interface OwnProps {}

interface StateProps {
    isAdmin: boolean;
}

interface DispatchProps {}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        views: {
            mainView: { isAdmin }
        }
    } = state;
    return { isAdmin };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {};
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Main);
