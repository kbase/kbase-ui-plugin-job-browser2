import { StoreState } from '../../redux/store';
import { Action, Dispatch } from 'redux';
import { connect } from 'react-redux';
import Component from './view';
import { search } from '../../redux/actions/publicAppStats';
import { PublicAppStatsViewData, PublicAppStatsQuery } from '../../redux/store/PublicAppStats';
import { ComponentLoadingState } from '../../redux/store/base';

export interface OwnProps { }

interface StateProps {
    view: PublicAppStatsViewData
}

interface DispatchProps {
    onSearch: (query: PublicAppStatsQuery) => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        views: {
            publicAppStatsView
        }
    } = state;

    if (publicAppStatsView.loadingState !== ComponentLoadingState.SUCCESS) {
        throw new Error('Invalid component loading state');
    }

    return {
        view: publicAppStatsView.view
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
