import { StoreState, SearchState, UserRunSummaryStat, UserRunSummaryQuery } from '../../redux/store';
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import Component from './view';
import { search } from '../../redux/actions/userRunSummary';

export interface OwnProps {}

interface StateProps {
    searchState: SearchState;
    userRunSummary: Array<UserRunSummaryStat>;
}

interface DispatchProps {
    search: (query: UserRunSummaryQuery) => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        views: {
            userRunSummaryView: { searchState, userRunSummary }
        }
    } = state;
    return { searchState, userRunSummary };
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
