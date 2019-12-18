import { JSONObject } from '../types/json'

export enum ComponentLoadingState {
    NONE = 0,
    LOADING,
    SUCCESS,
    ERROR
}


export interface UIError {
    code: number;
    message: string;
    data: JSONObject
}

export interface ViewBase {
    loadingState: ComponentLoadingState
}

export interface ViewNone extends ViewBase {
    loadingState: ComponentLoadingState.NONE
}

export interface ViewLoading extends ViewBase {
    loadingState: ComponentLoadingState.LOADING
}

export interface ViewError extends ViewBase {
    loadingState: ComponentLoadingState.ERROR;
    error: UIError
}

export interface ViewSuccess extends ViewBase {
    loadingState: ComponentLoadingState.SUCCESS;
}

// Search

export enum SearchState {
    NONE = 0,
    INITIAL_SEARCHING,
    SEARCHING,
    SEARCHED,
    ERROR
}

// APp

export interface AppStat {
    appId: string;
    functionId: string;
    functionTitle: string;
    moduleId: string;
    moduleTitle: string;
    runCount: number;
    errorCount: number;
    successRate: number;
    averageRunTime: number;
    averageQueueTime: number;
    totalRunTime: number;
}