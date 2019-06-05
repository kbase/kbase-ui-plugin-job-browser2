import { StoreState, SearchState } from '../store';
import { Reducer } from 'react';
import { Action } from 'redux';
import { ActionType } from '../actions';
import { SearchSuccess, SearchStart } from '../actions/publicAppStats';

function searchSuccess(state: StoreState, action: SearchSuccess): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            publicAppStatsView: {
                ...state.views.publicAppStatsView,
                searchState: SearchState.SEARCHED,
                appStats: action.appStats
            }
        }
    };
}

function searchStart(state: StoreState, action: SearchStart): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            publicAppStatsView: {
                ...state.views.publicAppStatsView,
                searchState: SearchState.SEARCHING
            }
        }
    };
}

const reducer: Reducer<StoreState | undefined, Action> = (state: StoreState | undefined, action: Action) => {
    if (!state) {
        return state;
    }
    switch (action.type) {
        case ActionType.PUBLIC_APP_STATS_SEARCH_START:
            return searchStart(state, action as SearchStart);
        case ActionType.PUBLIC_APP_STATS_SEARCH_SUCCESS:
            return searchSuccess(state, action as SearchSuccess);
    }
};

export default reducer;
