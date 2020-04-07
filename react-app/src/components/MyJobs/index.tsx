import React from 'react';
import { connect } from 'react-redux';
import { Spin, Alert } from 'antd';

import { StoreState } from '../../redux/store';
import ReduxInterface from './redux';
import { myJobsLoad } from '../../redux/actions/myJobs';
import { ComponentLoadingState } from '../../redux/store/base';
import { Action, Dispatch } from 'redux';

export interface GateProps {
    loadingState: ComponentLoadingState;
    onLoad: () => void;
}

export interface GateState {
}

export class Gate extends React.Component<GateProps, GateState> {

    componentDidMount() {
        this.props.onLoad();
    }

    renderLoading() {
        return <Spin />;
    }

    renderSuccess() {
        return <ReduxInterface />;
    }

    renderError() {
        return <Alert type="error" message="Error!" />;
    }

    render() {
        switch (this.props.loadingState) {
            case ComponentLoadingState.NONE:
            case ComponentLoadingState.LOADING:
                return this.renderLoading();
            case ComponentLoadingState.SUCCESS:
                return this.renderSuccess();
            case ComponentLoadingState.ERROR:
                return this.renderError();
        }
    }
}

// Store interface

interface OwnProps {
}

interface StateProps {
    loadingState: ComponentLoadingState;
}

interface DispatchProps {
    onLoad: () => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const { views: {
        myJobsView: {
            loadingState
        }
    } } = state;
    return { loadingState };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {
        onLoad: () => {
            dispatch(myJobsLoad() as any);
        }
    };
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Gate);
