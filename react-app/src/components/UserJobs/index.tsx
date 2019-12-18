import React from 'react';
import { connect } from 'react-redux';
import { Spin, Alert } from 'antd';

import { Action, Dispatch } from '@kbase/ui-components/node_modules/redux';

import { StoreState } from '../../redux/store';
import ReduxInterface from './redux';
import { userJobsLoad } from '../../redux/actions/userJobs';
import { ComponentLoadingState } from '../../redux/store/base';

export interface GateProps {
    loadingState: ComponentLoadingState
    onLoad: () => void;
}

export interface GateState {
}

export class Gate extends React.Component<GateProps, GateState> {

    componentDidMount() {
        this.props.onLoad();
    }

    renderLoading() {
        return <Spin />
    }

    renderSuccess() {
        return <ReduxInterface />;
    }

    renderError() {
        return <Alert type="error" message="Error!" />
    }

    render() {
        switch (this.props.loadingState) {
            case ComponentLoadingState.NONE:
            case ComponentLoadingState.LOADING:
                return this.renderLoading();
            case ComponentLoadingState.SUCCESS:
                return this.renderSuccess()
            case ComponentLoadingState.ERROR:
                return this.renderError();
        }
    }
}

// Store interface

interface OwnProps {
}

interface StateProps {
    loadingState: ComponentLoadingState
}

interface DispatchProps {
    onLoad: () => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const { views: {
        userJobsView: {
            loadingState
        }
    } } = state;
    return { loadingState };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {
        onLoad: () => {
            dispatch(userJobsLoad() as any)
        }
    };
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Gate);
