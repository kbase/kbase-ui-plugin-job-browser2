import { Action, Reducer } from 'redux';
import { StoreState } from '../store';

import { baseReducer } from '@kbase/ui-lib';
import { BaseStoreState } from '@kbase/ui-lib';
import myJobsReducer from './myJobs';
import userJobsReducer from './userJobs';
import appReducer from './app';
import publicAppStatsReducer from './publicAppStats';
import userRunSummary from './userRunSummary';

// export default function reducer<StoreState, Action>(state: StoreState, action: Action): StoreState {
//     return state;
// }

const reducer: Reducer<StoreState | undefined, Action> = (state: StoreState | undefined, action: Action) => {
    // TODO: we cast state to baseStore state, which should be fine since StoreState extends BaseStoreState.
    // and then we recast to store state when returning to make ts happy; the actual state object which passes
    // into and ...
    // WARNING: this may break if a base reducer (app or auth) does not copy all the state with ...state.
    // we probably need to use combine reducers?
    const baseState = baseReducer(state as BaseStoreState, action);
    if (baseState) {
        return baseState as StoreState;
    }
    return (
        appReducer(state, action) ||
        myJobsReducer(state, action) ||
        userJobsReducer(state, action) ||
        publicAppStatsReducer(state, action) ||
        userRunSummary(state, action) ||
        state
    );
};

export default reducer;
