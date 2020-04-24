import { Reducer } from 'react';
import { StoreState } from '../store';
import { Action } from 'redux';
import {
    MyJobsLoadLoading, MyJobsLoadError, MyJobsLoadSuccess
} from '../actions/myJobs';
import { ActionType } from '../actions';
import { ComponentLoadingState } from '../store/base';

function myJobsLoadLoading(state: StoreState, action: MyJobsLoadLoading): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            myJobsView: {
                loadingState: ComponentLoadingState.LOADING
            }
        }
    };
}

function myJobsLoadError(state: StoreState, action: MyJobsLoadError): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            myJobsView: {
                loadingState: ComponentLoadingState.ERROR,
                error: action.error
            }
        }
    };
}

function myJobsLoadSuccess(state: StoreState, action: MyJobsLoadSuccess): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            myJobsView: {
                loadingState: ComponentLoadingState.SUCCESS,
                data: action.data
            }
        }
    };
}

const reducer: Reducer<StoreState | undefined, Action> = (state: StoreState | undefined, action: Action) => {
    if (!state) {
        return state;
    }
    switch (action.type) {
        case ActionType.MY_JOBS_LOAD_LOADING:
            return myJobsLoadLoading(state, action as MyJobsLoadLoading);
        case ActionType.MY_JOBS_LOAD_ERROR:
            return myJobsLoadError(state, action as MyJobsLoadError);
        case ActionType.MY_JOBS_LOAD_SUCCESS:
            return myJobsLoadSuccess(state, action as MyJobsLoadSuccess);
    }
};

export default reducer;
