import { StoreState } from '../store';
import { MainLoadSuccess, Unload, MainLoadError } from '../actions/app';
import { Reducer } from 'react';
import { Action } from 'redux';
import { ActionType } from '../actions';
import { ComponentLoadingState } from '../store/base';

function mainLoadSuccess(state: StoreState, action: MainLoadSuccess): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            mainView: {
                ...state.views.mainView,
                loadingState: ComponentLoadingState.SUCCESS,
                isAdmin: action.isAdmin
            }
        }
    };
}

function mainLoadError(state: StoreState, action: MainLoadError): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            mainView: {
                ...state.views.mainView,
                loadingState: ComponentLoadingState.ERROR,
                error: action.error
            }
        }
    }
}

function unload(state: StoreState, action: Unload): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            mainView: {
                loadingState: ComponentLoadingState.NONE,
                isAdmin: false,
                error: null,
                // tabView: {
                //     type: ViewType.NONE
                // }
            }
        }
    };
}

const reducer: Reducer<StoreState | undefined, Action> = (state: StoreState | undefined, action: Action) => {
    if (!state) {
        return state;
    }
    switch (action.type) {
        case ActionType.MAIN_LOAD_SUCCESS:
            return mainLoadSuccess(state, action as MainLoadSuccess);
        case ActionType.MAIN_LOAD_ERROR:
            return mainLoadError(state, action as MainLoadError);
        case ActionType.MAIN_UNLOAD:
            return unload(state, action as Unload);
    }
};

export default reducer;
