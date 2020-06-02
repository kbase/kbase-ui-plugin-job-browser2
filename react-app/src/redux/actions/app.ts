import { Action } from 'redux';
import { ActionType } from '.';
import { AppError } from '@kbase/ui-components';

import { ThunkDispatch } from 'redux-thunk';
import { StoreState } from '../store';
import JobBrowserBFFClient from '../../lib/JobBrowserBFFClient';
import { SERVICE_TIMEOUT } from '../../constants';

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
                        ServiceWizard: { url: serviceWizardURL }
                    },
                    dynamicServices: {
                        JobBrowserBFF: jobBrowserBFFConfig
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

        const jobBrowserBFF = new JobBrowserBFFClient({
            token: userAuthorization.token,
            url: serviceWizardURL,
            timeout: SERVICE_TIMEOUT,
            version: jobBrowserBFFConfig.version
        });

        try {
            const { is_admin } = await jobBrowserBFF.is_admin();
            dispatch(mainLoadSuccess(is_admin ? true : false));
        } catch (ex) {
            // TODO improve detection of interesting errors, like jsonrpc,
            // to pull out more info to display to user.
            dispatch(
                mainLoadError({
                    message: ex.message,
                    code: 'error-checking-admin-status'
                })
            );
        }
    };
}

export function unload() {
    return {
        type: ActionType.MAIN_UNLOAD
    };
}
