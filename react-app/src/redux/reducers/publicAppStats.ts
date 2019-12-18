import {
    StoreState,
} from '../store';
import { Reducer } from 'react';
import { Action } from 'redux';
import { ActionType } from '../actions';
import {
    SearchSuccess, SearchStart, LoadLoading, LoadError, LoadSuccess
} from '../actions/publicAppStats';
import { ComponentLoadingState, SearchState } from '../store/base';

function searchSuccess(state: StoreState, action: SearchSuccess): StoreState {
    if (state.views.publicAppStatsView.loadingState !== ComponentLoadingState.SUCCESS) {
        return state;
    }

    if (state.views.publicAppStatsView.view.searchState !== SearchState.SEARCHING &&
        state.views.publicAppStatsView.view.searchState !== SearchState.INITIAL_SEARCHING) {
        return state;
    }

    return {
        ...state,
        views: {
            ...state.views,
            publicAppStatsView: {
                ...state.views.publicAppStatsView,
                view: {
                    ...state.views.publicAppStatsView.view,
                    searchState: SearchState.SEARCHED,
                    rawAppStats: action.appStats,
                    appStats: action.appStats
                }
            }
        }
    };
}

function searchStart(state: StoreState, action: SearchStart): StoreState {
    if (state.views.publicAppStatsView.loadingState !== ComponentLoadingState.SUCCESS) {
        return state;
    }

    if (state.views.publicAppStatsView.view.searchState !== SearchState.SEARCHED) {
        return state;
    }

    return {
        ...state,
        views: {
            ...state.views,
            publicAppStatsView: {
                ...state.views.publicAppStatsView,
                view: {
                    ...state.views.publicAppStatsView.view,
                    searchState: SearchState.SEARCHING
                }
            }
        }
    };
}

function loadLoading(state: StoreState, action: LoadLoading): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            publicAppStatsView: {
                ...state.views.publicAppStatsView,
                loadingState: ComponentLoadingState.LOADING
            }
        }
    }
}

function loadError(state: StoreState, action: LoadError): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            publicAppStatsView: {
                ...state.views.publicAppStatsView,
                loadingState: ComponentLoadingState.ERROR,
                error: action.error
            }
        }
    }
}

function loadSuccess(state: StoreState, action: LoadSuccess): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            publicAppStatsView: {
                ...state.views.publicAppStatsView,
                loadingState: ComponentLoadingState.SUCCESS,
                view: action.view
            }
        }
    }
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
        case ActionType.PUBLIC_APP_STATS_LOAD_LOADING:
            return loadLoading(state, action as LoadLoading);
        case ActionType.PUBLIC_APP_STATS_LOAD_ERROR:
            return loadError(state, action as LoadError);
        case ActionType.PUBLIC_APP_STATS_LOAD_SUCCESS:
            return loadSuccess(state, action as LoadSuccess);
    }
};

export default reducer;
