import { Action } from 'redux';
import { ActionType } from '.';
import { AppError, CatalogClient } from '@kbase/ui-lib';
import { ThunkDispatch } from 'redux-thunk';
import { StoreState } from '../store';

// MAIN Loading

export interface MainLoad extends Action<ActionType.MAIN_LOAD> {
    type: ActionType.MAIN_LOAD;
}

export interface MainLoadStart extends Action<ActionType.MAIN_LOAD_START> {
    type: ActionType.MAIN_LOAD_START;
}

export interface MainLoadSuccess extends Action<ActionType.MAIN_LOAD_SUCCESS> {
    type: ActionType.MAIN_LOAD_SUCCESS;
    isAdmin: boolean;
}

export interface MainLoadError extends Action<ActionType.MAIN_LOAD_ERROR> {
    type: ActionType.MAIN_LOAD_ERROR;
    error: AppError;
}

export interface Unload extends Action<ActionType.MAIN_UNLOAD> {
    type: ActionType.MAIN_UNLOAD;
}

export function mainLoadStart(): MainLoadStart {
    return {
        type: ActionType.MAIN_LOAD_START
    };
}

export function mainLoadSuccess(isAdmin: boolean): MainLoadSuccess {
    return {
        type: ActionType.MAIN_LOAD_SUCCESS,
        isAdmin
    };
}

export function mainLoadError(error: AppError): MainLoadError {
    return {
        type: ActionType.MAIN_LOAD_ERROR,
        error
    };
}

export function mainLoad() {
    return async (dispatch: ThunkDispatch<StoreState, void, Action>, getState: () => StoreState) => {
        dispatch(mainLoadStart());

        const {
            auth: { userAuthorization },
            app: {
                config: {
                    services: {
                        Catalog: { url: catalogURL }
                    }
                }
            }
        } = getState();

        if (!userAuthorization) {
            dispatch(
                mainLoadError({
                    message: 'Not authorized',
                    code: 'unauthorized'
                })
            );
            return;
        }

        // determine auth
        // TODO: we need a model object for interacting with the outside world
        const catalogClient = new CatalogClient({
            token: userAuthorization.token,
            url: catalogURL,
            module: 'Catalog'
        });
        catalogClient
            .isAdmin()
            .then((isAdmin) => {
                dispatch(mainLoadSuccess(isAdmin ? true : false));
            })
            .catch((err) => {
                dispatch(
                    mainLoadError({
                        message: err.message,
                        code: 'error-checking-admin-status'
                    })
                );
            });
    };
}

export function unload() {
    return {
        type: ActionType.MAIN_UNLOAD
    };
}
