import { StoreState, SearchState } from '../store';
import { Reducer } from 'react';
import { Action } from 'redux';
import { ActionType } from '../actions';
import { SearchSuccess, SearchStart } from '../actions/userRunSummary';

function searchSuccess(state: StoreState, action: SearchSuccess): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            userRunSummaryView: {
                ...state.views.userRunSummaryView,
                searchState: SearchState.SEARCHED,
                userRunSummary: action.userRunSummary
            }
        }
    };
}

function searchStart(state: StoreState, action: SearchStart): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            userRunSummaryView: {
                ...state.views.userRunSummaryView,
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
        case ActionType.USER_RUN_SUMMARY_SEARCH_START:
            return searchStart(state, action as SearchStart);
        case ActionType.USER_RUN_SUMMARY_SEARCH_SUCCESS:
            return searchSuccess(state, action as SearchSuccess);
    }
};

export default reducer;
