import { Action } from 'redux';
import { ActionType } from '.';
import { StoreState, UserRunSummaryQuery, UserRunSummaryStat } from '../store';
import { AppError, CatalogClient } from 'kbase-ui-lib';
import { ThunkDispatch } from 'redux-thunk';
import {} from './utils';

// Search

export interface Search extends Action<ActionType.USER_RUN_SUMMARY_SEARCH> {
    type: ActionType.USER_RUN_SUMMARY_SEARCH;
    query: UserRunSummaryQuery;
}

export interface SearchStart extends Action<ActionType.USER_RUN_SUMMARY_SEARCH_START> {
    type: ActionType.USER_RUN_SUMMARY_SEARCH_START;
}

export interface SearchError extends Action<ActionType.USER_RUN_SUMMARY_SEARCH_ERROR> {
    type: ActionType.USER_RUN_SUMMARY_SEARCH_ERROR;
    error: AppError;
}

export interface SearchSuccess extends Action<ActionType.USER_RUN_SUMMARY_SEARCH_SUCCESS> {
    type: ActionType.USER_RUN_SUMMARY_SEARCH_SUCCESS;
    userRunSummary: Array<UserRunSummaryStat>;
}

function searchStart(): SearchStart {
    return {
        type: ActionType.USER_RUN_SUMMARY_SEARCH_START
    };
}

function searchError(error: AppError): SearchError {
    return {
        type: ActionType.USER_RUN_SUMMARY_SEARCH_ERROR,
        error
    };
}

function searchSuccess(userRunSummary: Array<UserRunSummaryStat>): SearchSuccess {
    return {
        type: ActionType.USER_RUN_SUMMARY_SEARCH_SUCCESS,
        userRunSummary
    };
}

export function search(query: UserRunSummaryQuery) {
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
        const params = {
            begin: 0,
            end: Date.now()
        };
        const rawStats = await catalogClient.getExecAggrTable(params);
        const stats = rawStats.map((stat) => {
            let appId, moduleId, functionId;
            if (!stat.app) {
                moduleId = stat.func_mod;
                functionId = stat.func;
                appId = [moduleId, functionId].join('/');
            } else {
                [moduleId, functionId] = stat.app.split('/');
                appId = stat.app;
            }

            if (!moduleId || !functionId) {
                console.warn('bad app!', stat);
            }

            return {
                username: stat.user,
                appId: appId,
                moduleId: moduleId,
                functionId: functionId,
                runCount: stat.n
            } as UserRunSummaryStat;
        });

        const expression = query.query.split(/\s+/).map((term) => {
            return new RegExp(term, 'i');
        });
        const filtered = stats.filter((stat) => {
            return expression.every((term) => {
                return (
                    term.test(stat.appId) ||
                    term.test(stat.moduleId) ||
                    term.test(stat.functionId) ||
                    term.test(stat.username)
                );
            });
        });

        dispatch(searchSuccess(filtered));
    };
}
