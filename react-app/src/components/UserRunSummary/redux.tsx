import { StoreState } from '../../redux/store';
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import Component from './view';
import { search } from '../../redux/actions/userRunSummary';
import { UserRunSummaryQuery, UserRunSummaryViewData } from '../../redux/store/UserRunSummary';
import { ComponentLoadingState } from '../../redux/store/base';

export interface OwnProps { }

interface StateProps {
    view: UserRunSummaryViewData
}

interface DispatchProps {
    search: (query: UserRunSummaryQuery) => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        views: {
            userRunSummaryView
        }
    } = state;

    if (userRunSummaryView.loadingState !== ComponentLoadingState.SUCCESS) {
        throw new Error('Invalid component loading state');
    }

    return {
        view: userRunSummaryView.view
    };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {
        search: (query: UserRunSummaryQuery) => {
            dispatch(search(query) as any);
        }
    };
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Component);
