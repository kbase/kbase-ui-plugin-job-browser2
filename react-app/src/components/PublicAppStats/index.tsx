import React from 'react';
import { connect } from 'react-redux';
import { Spin, Alert } from 'antd';

import { Action, Dispatch } from '@kbase/ui-components/node_modules/redux';

import {
    StoreState
} from '../../redux/store';
import ReduxInterface from './redux';
import { load } from '../../redux/actions/publicAppStats';
import { PublicAppStatsView, PublicAppStatsViewData } from '../../redux/store/PublicAppStats';
import { ComponentLoadingState } from '../../redux/store/base';

export interface GateProps {
    view: PublicAppStatsView
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

    renderSuccess(view: PublicAppStatsViewData) {
        return <ReduxInterface />;
    }

    renderError() {
        return <Alert type="error" message="Error!" />
    }

    render() {
        const view = this.props.view;
        switch (view.loadingState) {
            case ComponentLoadingState.NONE:
            case ComponentLoadingState.LOADING:
                return this.renderLoading();
            case ComponentLoadingState.SUCCESS:
                return this.renderSuccess(view.view)
            case ComponentLoadingState.ERROR:
                return this.renderError();
        }
    }
}

// Store interface

interface OwnProps {
}

interface StateProps {
    view: PublicAppStatsView
}

interface DispatchProps {
    onLoad: () => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        views: {
            publicAppStatsView
        }
    } = state;
    return { view: publicAppStatsView };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {
        onLoad: () => {
            dispatch(load() as any)
        }
    };
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(Gate);
