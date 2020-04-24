import React from 'react';
import { Button } from 'antd';

export interface NavStateBase {
    enabled: boolean;
}

export interface NavStateNone extends NavStateBase {
    enabled: false;
}

export interface NavStateOk extends NavStateBase {
    enabled: true;
    page: number;
    pageCount: number;
    total: number;
    firstPage: () => void;
    previousPage: () => void;
    nextPage: () => void;
    lastPage: () => void;
}

export type NavState = NavStateNone | NavStateOk;

export interface TableNavProps {
    state: NavState;
}

interface TableNavState {
}

export default class TableNav extends React.Component<TableNavProps, TableNavState> {
    gotoFirstPage(state: NavStateOk) {
        state.firstPage();
    }

    gotoPreviousPage(state: NavStateOk) {
        state.previousPage();
    }

    gotoNextPage(state: NavStateOk) {
        state.nextPage();
    }

    gotoLastPage(state: NavStateOk) {
        state.lastPage();
    }

    renderFirstButton(state: NavStateOk) {
        const disabled = (state.page === 1);
        return <Button icon="step-backward" onClick={() => { this.gotoFirstPage(state); }} disabled={disabled} />;
    }

    renderPreviousButton(state: NavStateOk) {
        const disabled = (state.page === 1);
        return <Button icon="left" onClick={() => { this.gotoPreviousPage(state); }} disabled={disabled} />;
    }

    renderNextButton(state: NavStateOk) {
        const disabled = (state.page === state.pageCount);
        return <Button icon="right" onClick={() => { this.gotoNextPage(state); }} disabled={disabled} />;
    }

    renderLastButton(state: NavStateOk) {
        const disabled = (state.page === state.pageCount);
        return <Button icon="step-forward" onClick={() => { this.gotoLastPage(state); }} disabled={disabled} />;
    }

    renderButtons(state: NavStateOk) {
        return <Button.Group>
            {this.renderFirstButton(state)}
            {this.renderPreviousButton(state)}
            {this.renderNextButton(state)}
            {this.renderLastButton(state)}
        </Button.Group>;
    }

    renderButtonsDisabled() {
        return <Button.Group>
            <Button icon="step-backward" disabled />
            <Button icon="left" disabled />
            <Button icon="right" disabled />
            <Button icon="step-forward" disabled />
        </Button.Group>;
    }

    renderPageInfo(state: NavStateOk) {
        return <span>
            page {state.page} of {state.pageCount}
        </span>;
    }

    renderTotal(state: NavStateOk) {
        return <span>
            ({state.total} entries)
        </span>;
    }

    render() {
        const content = (() => {
            if (this.props.state.enabled) {
                return <>
                    {this.renderButtons(this.props.state)}
                    <span style={{ width: '10px' }} />
                    {this.renderPageInfo(this.props.state)}
                    <span style={{ width: '10px' }} />
                    {this.renderTotal(this.props.state)}
                </>;
            } else {
                return this.renderButtonsDisabled();
            }
        })();
        return <div className="Table-nav">
            {content}
        </div>;
    }
}