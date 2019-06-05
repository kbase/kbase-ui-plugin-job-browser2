import { StoreState, SearchState } from '../store';
import {
    UserJobsSearchStart,
    UserJobsSearchSuccess,
    UserJobsCancelJobStart,
    UserJobsCancelJobSuccess
} from '../actions/userJobs';
import { Reducer } from 'react';
import { Action } from 'redux';
import { ActionType } from '../actions';

function userJobsSearchStart(state: StoreState, action: UserJobsSearchStart): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            userJobsView: {
                ...state.views.userJobsView,
                searchState: SearchState.SEARCHING
            }
        }
    };
}

function userJobsSearchSuccess(state: StoreState, action: UserJobsSearchSuccess): StoreState {
    const newState = {
        ...state,
        views: {
            ...state.views,
            userJobsView: {
                ...state.views.userJobsView,
                searchState: SearchState.SEARCHED,
                rawJobs: action.rawJobs,
                jobs: action.jobs,
                jobsFetchedAt: action.jobsFetchedAt,
                searchExpression: action.searchExpression
            }
        }
    };
    return newState;
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
    }
};

export default reducer;
