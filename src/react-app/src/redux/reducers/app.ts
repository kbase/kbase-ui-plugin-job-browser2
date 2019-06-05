import { StoreState, ComponentLoadingState } from '../store';
import { MainLoadSuccess, Unload } from '../actions/app';
import { Reducer } from 'react';
import { Action } from 'redux';
import { ActionType } from '../actions';

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

function unload(state: StoreState, action: Unload): StoreState {
    return {
        ...state,
        views: {
            ...state.views,
            mainView: {
                loadingState: ComponentLoadingState.NONE,
                isAdmin: false,
                error: null
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
        case ActionType.MAIN_UNLOAD:
            return unload(state, action as Unload);
    }
};

export default reducer;
