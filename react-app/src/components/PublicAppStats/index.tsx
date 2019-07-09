import { StoreState, AppStat, PublicAppStatsQuery, SearchState } from '../../redux/store';
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import Component from './view';
import { search } from '../../redux/actions/publicAppStats';

export interface OwnProps {}

interface StateProps {
    searchState: SearchState;
    appStats: Array<AppStat>;
}

interface DispatchProps {
    onSearch: (query: PublicAppStatsQuery) => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        views: {
            publicAppStatsView: { appStats, searchState }
        }
    } = state;
    return {
        searchState,
        appStats
    };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {
        onSearch: (query: PublicAppStatsQuery) => {
            dispatch(search(query) as any);
        }
    };
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Component);
