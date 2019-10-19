import { Action } from 'redux';
import { ActionType } from '.';
import { StoreState, UserRunSummaryQuery, UserRunSummaryStat } from '../store';
import { CatalogClient } from '@kbase/ui-lib';
import { AppError } from '@kbase/ui-components';
import { ThunkDispatch } from 'redux-thunk';
import { } from './utils';

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
        const stats: Array<UserRunSummaryStat> = rawStats.map((stat) => {
            let appId: string | null = stat.app;
            if (!appId) {
                appId = null;
            }

            return {
                username: stat.user,
                isApp: stat.app ? true : false,
                appId: stat.app || null,
                moduleName: stat.func_mod,
                functionName: stat.func,
                runCount: stat.n
            } as UserRunSummaryStat;
        });

        const expression = query.query.split(/\s+/).map((term) => {
            return new RegExp(term, 'i');
        });
        const filtered = stats.filter((stat) => {
            return expression.every((term) => {
                return (
                    (stat.appId && term.test(stat.appId)) ||
                    term.test(stat.moduleName) ||
                    term.test(stat.functionName) ||
                    term.test(stat.username)
                );
            });
        });

        dispatch(searchSuccess(filtered));
    };
}
