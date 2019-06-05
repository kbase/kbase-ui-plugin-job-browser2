import { mainLoadStart, mainLoadError, mainLoadSuccess } from './app';
import { ActionType } from './index';
import { AppError } from 'kbase-ui-lib/lib/redux/store';

it('generates start action', () => {
    const loadStartAction = mainLoadStart();
    expect(loadStartAction.type).toEqual(ActionType.MAIN_LOAD_START);
});

it('generates error action', () => {
    const err: AppError = {
        message: 'Test error',
        code: 'test'
    };
    const action = mainLoadError(err);
    expect(action.type).toEqual(ActionType.MAIN_LOAD_ERROR);
    expect(action.error.code).toEqual(err.code);
    expect(action.error.message).toEqual(err.message);
});

it('generates success action', () => {
    const isAdmin: boolean = false;
    const action = mainLoadSuccess(isAdmin);
    expect(action.type).toEqual(ActionType.MAIN_LOAD_SUCCESS);
    expect(action.isAdmin).toEqual(isAdmin);
});
