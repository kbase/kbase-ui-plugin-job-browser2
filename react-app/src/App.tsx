/**
 * The top component of the App, named appropriately App.
 *
 * As the top level component of the app, it is responsible for the setting up
 * any top level support such as the KBase integration (kbase-ui's AppBase) and
 * the redux store.
 */

// 3rd party
import React from 'react';
import { createReduxStore } from './redux/store';
import { Provider } from 'react-redux';

// KBase external
import { AppBase } from '@kbase/ui-components';

import { AuthGate } from '@kbase/ui-components';

// project
import Main from './components/Main';
import ErrorBoundary from './components/ErrorBoundary'

// file
import './App.css';

/**
 * The app currently has no props, but we establish
 * a props interface as a placeholder.
 */
export interface AppProps { }

/**
 * The app currently has no state, but we establish
 * a state interface as a placeholder.
 */
interface AppState { }

// Redux setup
const store = createReduxStore();

/**
 * The top level component for the entire web app.
 *
 * @remarks
 * Also see the [kbase-ui] support library, which provides AppBase
 *
 * @public
 */
export default class App extends React.Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <ErrorBoundary>
                <Provider store={store}>
                    <AppBase>
                        <AuthGate required={true}>
                            <Main />
                        </AuthGate>
                    </AppBase>
                </Provider>
            </ErrorBoundary>
        );
    }
}
