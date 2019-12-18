import { Reducer } from 'react';
import { StoreState, JobSearchState } from '../store';
import { Action } from 'redux';
import { MyJobsSearchStart, MyJobsSearchSuccess, MyJobsCancelJobSuccess, MyJobsLoadLoading, MyJobsLoadError, MyJobsLoadSuccess } from '../actions/myJobs';
import { ActionType } from '../actions';
import { ComponentLoadingState } from '../store/base';

function myJobsSearchStart(state: StoreState, action: MyJobsSearchStart): StoreState {
    if (state.views.myJobsView.loadingState !== ComponentLoadingState.SUCCESS) {
        return state;
    }
    if (state.views.myJobsView.data.searchState !== JobSearchState.SEARCHING &&
        state.views.myJobsView.data.searchState !== JobSearchState.READY) {
        return state;
    }
    return {
        ...state,
        views: {
            ...state.views,
            myJobsView: {
                ...state.views.myJobsView,

                data: {
                    ...state.views.myJobsView.data,
                    searchState: JobSearchState.SEARCHING
                }

            }
        }
    };
}

function myJobsSearchSuccess(state: StoreState, action: MyJobsSearchSuccess): StoreState {
    if (state.views.myJobsView.loadingState !== ComponentLoadingState.SUCCESS) {
        return state;
    }
    if (state.views.myJobsView.data.searchState !== JobSearchState.SEARCHING &&
        state.views.myJobsView.data.searchState !== JobSearchState.INITIAL_SEARCHING) {
        return state;
    }
    return {
        ...state,
        views: {
            ...state.views,
            myJobsView: {
                ...state.views.myJobsView,
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

function myJobsLoadLoading(state: StoreState, action: MyJobsLoadLoading): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            myJobsView: {
                loadingState: ComponentLoadingState.LOADING
            }
        }
    }
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
    }
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
    }
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
        case ActionType.MY_JOBS_LOAD_LOADING:
            return myJobsLoadLoading(state, action as MyJobsLoadLoading);
        case ActionType.MY_JOBS_LOAD_ERROR:
            return myJobsLoadError(state, action as MyJobsLoadError);
        case ActionType.MY_JOBS_LOAD_SUCCESS:
            return myJobsLoadSuccess(state, action as MyJobsLoadSuccess);
    }
};

export default reducer;
