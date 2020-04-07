import { Action } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { CatalogClient } from '@kbase/ui-lib';
import { AppError } from '@kbase/ui-components';

import { ActionType } from '.';
import { StoreState } from '../store';
import { PublicAppStatsViewData, PublicAppStatsViewDataInitialSearching, PublicAppStatsQuery } from '../store/PublicAppStats';
import { SearchState, AppStat } from '../store/base';
import { UIError } from '../types/error';

function calcAverage(total: number, count: number) {
    if (total) {
        if (count) {
            return total / count;
        } else {
            return null;
        }
    } else {
        if (count) {
            return 0;
        } else {
            return null;
        }
    }
}

function calcRate(part: number, whole: number) {
    if (part) {
        if (whole) {
            return part / whole;
        } else {
            return null;
        }
    } else {
        if (whole) {
            return 0;
        } else {
            return null;
        }
    }
}

// Loading

export interface LoadLoading extends Action<ActionType.PUBLIC_APP_STATS_LOAD_LOADING> {
    type: ActionType.PUBLIC_APP_STATS_LOAD_LOADING;
}

export interface LoadSuccess extends Action<ActionType.PUBLIC_APP_STATS_LOAD_SUCCESS> {
    type: ActionType.PUBLIC_APP_STATS_LOAD_SUCCESS;
    view: PublicAppStatsViewData;
}

export interface LoadError extends Action<ActionType.PUBLIC_APP_STATS_LOAD_ERROR> {
    type: ActionType.PUBLIC_APP_STATS_LOAD_ERROR;
    error: UIError;
}

export function loadLoading(): LoadLoading {
    return {
        type: ActionType.PUBLIC_APP_STATS_LOAD_LOADING
    };
}

export function loadSuccess(view: PublicAppStatsViewDataInitialSearching): LoadSuccess {
    return {
        type: ActionType.PUBLIC_APP_STATS_LOAD_SUCCESS,
        view
    };
}

export function loadError(error: UIError) {
    return {
        type: ActionType.PUBLIC_APP_STATS_LOAD_ERROR,
        error
    };
}

export function load() {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(loadLoading());

        dispatch(loadSuccess({
            searchState: SearchState.INITIAL_SEARCHING,
            query: {
                query: ''
            }
        }));

        dispatch(search({
            query: ''
        }));
    };
}

// Search

export interface Search extends Action<ActionType.PUBLIC_APP_STATS_SEARCH> {
    type: ActionType.PUBLIC_APP_STATS_SEARCH;
    query: PublicAppStatsQuery;
}

export interface SearchStart extends Action<ActionType.PUBLIC_APP_STATS_SEARCH_START> {
    type: ActionType.PUBLIC_APP_STATS_SEARCH_START;
}

export interface SearchError extends Action<ActionType.PUBLIC_APP_STATS_SEARCH_ERROR> {
    type: ActionType.PUBLIC_APP_STATS_SEARCH_ERROR;
    error: AppError;
}

export interface SearchSuccess extends Action<ActionType.PUBLIC_APP_STATS_SEARCH_SUCCESS> {
    type: ActionType.PUBLIC_APP_STATS_SEARCH_SUCCESS;
    appStats: Array<AppStat>;
}

function searchStart(): SearchStart {
    return {
        type: ActionType.PUBLIC_APP_STATS_SEARCH_START
    };
}

function searchError(error: AppError): SearchError {
    return {
        type: ActionType.PUBLIC_APP_STATS_SEARCH_ERROR,
        error
    };
}

function searchSuccess(appStats: Array<AppStat>): SearchSuccess {
    return {
        type: ActionType.PUBLIC_APP_STATS_SEARCH_SUCCESS,
        appStats
    };
}

export function search(query: PublicAppStatsQuery) {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(searchStart());

        const {
            auth: { userAuthorization },
            app: {
                config: {
                    services: {
                        Catalog: { url: catalogUrl }
                    }
                }
            }
        } = getState();

        if (!userAuthorization) {
            dispatch(
                searchError({
                    message: 'Not authorized',
                    code: 'unauthorized'
                })
            );
            return;
        }

        if (!userAuthorization) {
            dispatch(
                searchError({
                    message: 'Not authorized',
                    code: 'unauthorized'
                })
            );
            return;
        }

        const catalogClient = new CatalogClient({
            module: 'Catalog',
            token: userAuthorization.token,
            url: catalogUrl
        });
        const rawStats = await catalogClient.getExecAggrStats({});
        const stats = rawStats.map((stat) => {
            const [moduleId, functionId] = stat.full_app_id.split('/');
            if (!moduleId || !functionId) {
                console.warn('bad app!', stat);
            }
            const successRate = calcRate(stat.number_of_calls - stat.number_of_errors, stat.number_of_calls);
            const averageRunTime = calcAverage(stat.total_exec_time, stat.number_of_calls);
            const averageQueueTime = calcAverage(stat.total_queue_time, stat.number_of_calls);
            return {
                appId: stat.full_app_id,
                moduleId,
                functionId: functionId || '',
                moduleTitle: moduleId,
                functionTitle: functionId || '',
                runCount: stat.number_of_calls,
                errorCount: stat.number_of_errors,
                successRate,
                averageRunTime,
                averageQueueTime,
                totalRunTime: stat.total_queue_time
            } as AppStat;
        });

        const terms = query.query.match(/\S+/);

        if (terms === null) {
            dispatch(searchSuccess(stats));
            return;
        }

        const expression = terms.map((term) => {
            return new RegExp(term, 'i');
        });
        const filtered = stats.filter((stat) => {
            return expression.every((term) => {
                return (
                    term.test(stat.moduleTitle) ||
                    term.test(stat.moduleId) ||
                    term.test(stat.functionTitle) ||
                    term.test(stat.functionId)
                );
            });
        });

        dispatch(searchSuccess(filtered));
    };
}
