import { Reducer } from 'react';
import { StoreState, SearchState } from '../store';
import { Action } from 'redux';
import { MyJobsSearchStart, MyJobsSearchSuccess, MyJobsCancelJobSuccess } from '../actions/myJobs';
import { ActionType } from '../actions';

function myJobsSearchStart(state: StoreState, action: MyJobsSearchStart): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            myJobsView: {
                ...state.views.myJobsView,
                searchState: SearchState.SEARCHING
            }
        }
    };
}

function myJobsSearchSuccess(state: StoreState, action: MyJobsSearchSuccess): StoreState {
    const newState = {
        ...state,
        views: {
            ...state.views,
            myJobsView: {
                ...state.views.myJobsView,
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

function myJobsCancelJobSuccess(state: StoreState, action: MyJobsCancelJobSuccess): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            myJobsView: {
                ...state.views.myJobsView
                // TODO: should twiddle a cancellation status for the job.
            }
        }
    };
}

const reducer: Reducer<StoreState | undefined, Action> = (state: StoreState | undefined, action: Action) => {
    if (!state) {
        return state;
    }
    switch (action.type) {
        case ActionType.MY_JOBS_SEARCH_SUCCESS:
            return myJobsSearchSuccess(state, action as MyJobsSearchSuccess);
        case ActionType.MY_JOBS_SEARCH_START:
            return myJobsSearchStart(state, action as MyJobsSearchStart);
        case ActionType.MY_JOBS_CANCEL_SUCCESS:
            return myJobsCancelJobSuccess(state, action as MyJobsCancelJobSuccess);
    }
};

export default reducer;
