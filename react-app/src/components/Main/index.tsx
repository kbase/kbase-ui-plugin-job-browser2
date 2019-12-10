/**
 * This is a "loader" component. It is solely responsible for
 */
import * as React from 'react';
import { ComponentLoadingState, StoreState, MainView } from '../../redux/store';
import Container from './state';

// The redux connection

import { Dispatch, Action } from 'redux';
import { connect } from 'react-redux';

import { Spin, Alert } from 'antd';
import { mainLoad, unload } from '../../redux/actions/app';

// First the loader component, which takes care of a loading view, error view, and the
// container.

export interface LoaderProps {
    view: MainView;
    onLoad: () => void;
    unload: () => void;
}

interface LoaderState { }

class Loader extends React.Component<LoaderProps, LoaderState> {
    renderLoading() {
        const message = (
            <div>
                Loading Main ... <Spin />
            </div>
        );
        return (
            <Alert
                type="info"
                message={message}
                style={{
                    width: '20em',
                    padding: '20px',
                    margin: '20px auto'
                }}
            />
        );
    }

    renderError() {
        if (!this.props.view.error) {
            return;
        }
        return <Alert type="error" message={this.props.view.error.message} />;
    }

    render() {
        switch (this.props.view.loadingState) {
            case ComponentLoadingState.NONE:
                return this.renderLoading();
            case ComponentLoadingState.LOADING:
                return this.renderLoading();
            case ComponentLoadingState.ERROR:
                return this.renderError();
            case ComponentLoadingState.SUCCESS:
                return <Container />;
        }
    }

    componentDidMount() {
        // this.props.onLoad();
        switch (this.props.view.loadingState) {
            case ComponentLoadingState.NONE:
                // should only appear briefly as the LOAD event is processed.
                this.props.onLoad();
        }
    }

    componentWillUnmount() {
        this.props.unload();
    }
}

/**
 * This is the redux interface -- the main entry point for the Main Component.
 */

export interface OwnProps { }

interface StateProps {
    view: MainView;
    token: string;
}

interface DispatchProps {
    onLoad: () => void;
    unload: () => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        auth: { userAuthorization },
        views: { mainView }
    } = state;
    return {
        view: mainView,
        token: userAuthorization!.token
    };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, props: OwnProps): DispatchProps {
    return {
        onLoad: () => {
            dispatch(mainLoad() as any);
        },
        unload: () => {
            dispatch(unload() as any);
        }
    };
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Loader);
