import { StoreState, JobSearchState } from '../store';
import {
    UserJobsSearchStart,
    UserJobsSearchSuccess,
    UserJobsCancelJobStart,
    UserJobsCancelJobSuccess,
    UserJobsLoadLoading,
    UserJobsLoadError,
    UserJobsLoadSuccess
} from '../actions/userJobs';
import { Reducer } from 'react';
import { Action } from 'redux';
import { ActionType } from '../actions';
import { ComponentLoadingState } from '../store/base';

function userJobsSearchStart(state: StoreState, action: UserJobsSearchStart): StoreState {
    if (state.views.userJobsView.loadingState !== ComponentLoadingState.SUCCESS) {
        return state;
    }

    if (state.views.userJobsView.data.searchState !== JobSearchState.SEARCHING &&
        state.views.userJobsView.data.searchState !== JobSearchState.READY) {
        return state;
    }
    return {
        ...state,
        views: {
            ...state.views,
            userJobsView: {
                ...state.views.userJobsView,

                data: {
                    ...state.views.userJobsView.data,
                    searchState: JobSearchState.SEARCHING
                }

            }
        }
    };
}

function userJobsSearchSuccess(state: StoreState, action: UserJobsSearchSuccess): StoreState {
    if (state.views.userJobsView.loadingState !== ComponentLoadingState.SUCCESS) {
        return state;
    }
    if (state.views.userJobsView.data.searchState !== JobSearchState.SEARCHING &&
        state.views.userJobsView.data.searchState !== JobSearchState.INITIAL_SEARCHING) {
        return state;
    }
    return {
        ...state,
        views: {
            ...state.views,
            userJobsView: {
                ...state.views.userJobsView,
                data: {
                    searchState: JobSearchState.READY,
                    searchExpression: action.searchExpression,
                    searchResult: {
                        jobs: action.jobs,
                        jobsFetchedAt: action.jobsFetchedAt,
                        foundCount: action.foundCount,
                        totalCount: action.totalCount
                    }
                }
            }
        }
    };
}

function cancelJobStart(state: StoreState, action: UserJobsCancelJobStart): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            userJobsView: {
                ...state.views.userJobsView
                // TODO: need cancelation state...
            }
        }
    };
}

function cancelJobSuccess(state: StoreState, action: UserJobsCancelJobSuccess): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            userJobsView: {
                ...state.views.userJobsView
                // TODO: need cancelation state...
            }
        }
    };
}

function userJobsLoadLoading(state: StoreState, action: UserJobsLoadLoading): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            userJobsView: {
                loadingState: ComponentLoadingState.LOADING
            }
        }
    }
}

function userJobsLoadError(state: StoreState, action: UserJobsLoadError): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            userJobsView: {
                loadingState: ComponentLoadingState.ERROR,
                error: action.error
            }
        }
    }
}

function userJobsLoadSuccess(state: StoreState, action: UserJobsLoadSuccess): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            userJobsView: {
                loadingState: ComponentLoadingState.SUCCESS,
                data: action.data
            }
        }
    }
}

const reducer: Reducer<StoreState | undefined, Action> = (state: StoreState | undefined, action: Action) => {
    if (!state) {
        return state;
    }
    switch (action.type) {
        case ActionType.USER_JOBS_SEARCH_START:
            return userJobsSearchStart(state, action as UserJobsSearchStart);
        case ActionType.USER_JOBS_SEARCH_SUCCESS:
            return userJobsSearchSuccess(state, action as UserJobsSearchSuccess);
        case ActionType.USER_JOBS_CANCEL_START:
            return cancelJobStart(state, action as UserJobsCancelJobStart);
        case ActionType.USER_JOBS_CANCEL_SUCCESS:
            return cancelJobSuccess(state, action as UserJobsCancelJobSuccess);
        case ActionType.USER_JOBS_LOAD_LOADING:
            return userJobsLoadLoading(state, action as UserJobsLoadLoading);
        case ActionType.USER_JOBS_LOAD_ERROR:
            return userJobsLoadError(state, action as UserJobsLoadError);
        case ActionType.USER_JOBS_LOAD_SUCCESS:
            return userJobsLoadSuccess(state, action as UserJobsLoadSuccess);
    }
};

export default reducer;
