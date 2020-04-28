import React, { ReactNode } from 'react';
import './Table.css';
import { Alert, Spin, Empty } from 'antd';
import TableNav, { Term } from './TableNav';

const ROW_HEIGHT = 50;
// const HEADER_HEIGHT = 50;
// const NAV_HEIGHT = 50;
const RESIZE_WAIT = 1000;

export enum AsyncProcessState {
    NONE = "NONE",
    PROCESSING = "PROCESSING",
    REPROCESSING = "REPROCESSING",
    SUCCESS = "SUCCESS",
    ERROR = "ERROR"
}

export interface DataSourceBase {
    status: AsyncProcessState;
}

export interface DataSourceNone extends DataSourceBase {
    status: AsyncProcessState.NONE;
}

export interface DataSourceProcessing extends DataSourceBase {
    status: AsyncProcessState.PROCESSING;
}

export interface DataSourceSuccess<D> extends DataSourceBase {
    status: AsyncProcessState.SUCCESS,
    data: Array<D>;
    count: number;
    total: number;
    offset: number;
    limit: number;
    page: number;
    pageCount: number;
}

export interface DataSourceReprocessing<D> extends DataSourceBase {
    status: AsyncProcessState.REPROCESSING,
    data: Array<D>;
    count: number;
    total: number;
    offset: number;
    limit: number;
    page: number;
    pageCount: number;
}

export interface DataSourceError extends DataSourceBase {
    status: AsyncProcessState.ERROR,
    error: DataSourceException;
}

export type DataSource<D> =
    DataSourceNone |
    DataSourceProcessing |
    DataSourceSuccess<D> |
    DataSourceReprocessing<D> |
    DataSourceError;

export class DataSourceException extends Error { }

export interface Column<D> {
    id: string;
    label: string;
    render: (row: D) => ReactNode;
}

export interface TableConfig {
    rowsPerPage: number;
    pageCount: number | null;
    currentPage: number | null;
}

export interface TableProps<D> {
    dataSource: DataSource<D>;
    columns: Array<Column<D>>;
    noun: Term;
    config: (tableConfig: TableConfig) => void;
    firstPage: () => void;
    previousPage: () => void;
    nextPage: () => void;
    lastPage: () => void;
}

enum TableStatus {
    NONE,
    LOADING,
    OK,
    ERROR
}

export interface TableState {
    status: TableStatus;
}

export interface TableStateNone {
    status: TableStatus.NONE;
}

export interface TableStateLoading {
    status: TableStatus.LOADING;
}

export interface TableStateOk {
    status: TableStatus.OK,

}

export interface Table2State {
    status: TableStatus;
}

export default class Table2<D> extends React.Component<TableProps<D>, Table2State> {
    bodyRef: React.RefObject<HTMLDivElement>;
    resizing: boolean;

    constructor(props: TableProps<D>) {
        super(props);
        this.bodyRef = React.createRef();
        this.resizing = false;
        this.state = {
            status: TableStatus.NONE
        };
    }

    componentDidMount() {
        // measure height
        this.setRowsPerPage();
        this.setState({
            status: TableStatus.OK
        });
        this.listenForResize();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resizeListener);
    }

    setRowsPerPage() {
        const rowsPerPage = this.calcRowsPerPage();
        // if (this.props.dataSource.status === syncProcessState.SUCCESS) {

        // }
        const config: TableConfig = (() => {
            switch (this.props.dataSource.status) {
                case AsyncProcessState.NONE:
                    return {
                        rowsPerPage,
                        currentPage: null,
                        pageCount: null
                    };
                case AsyncProcessState.PROCESSING:
                    return {
                        rowsPerPage,
                        currentPage: null,
                        pageCount: null
                    };
                case AsyncProcessState.REPROCESSING:
                    return {
                        rowsPerPage,
                        currentPage: null,
                        pageCount: null
                    };
                case AsyncProcessState.ERROR:
                    return {
                        rowsPerPage,
                        currentPage: null,
                        pageCount: null
                    };
                case AsyncProcessState.SUCCESS:
                    return {
                        rowsPerPage,
                        currentPage: null,
                        pageCount: null
                    };
            }
        })();
        this.props.config(config);
    }

    calcRowsPerPage() {
        const body = this.bodyRef.current;
        if (body === null) {
            throw new Error('No table body!');
        }
        const height = body.offsetHeight;
        return Math.floor(height / ROW_HEIGHT);
    }

    resizeListener() {
        if (this.resizing) {
            return;
        }
        this.resizing = true;
        // window.requestAnimationFrame(() => {
        //     this.resizing = false;
        //     this.setRowsPerPage();
        // });

        window.setTimeout(() => {
            this.resizing = false;

            this.setRowsPerPage();
        }, RESIZE_WAIT);
    }


    listenForResize() {
        window.addEventListener('resize', this.resizeListener.bind(this));
    }

    renderHeader() {
        const cells = this.props.columns.map((column) => {
            return <div className="Table-cell" key={column.id}>
                <div className="Table-content">
                    {column.label}
                </div>
            </div>;
        });
        return <div className="Table-header">
            <div className="Table-row">
                {cells}
            </div>
        </div>;
    }

    renderRow() {

    }

    renderTableRows(dataSource: DataSourceSuccess<D> | DataSourceReprocessing<D>) {
        if (dataSource.data.length === 0) {
            return <Empty />;
        }
        return dataSource.data.map((datum, rowNumber) => {
            const cells = this.props.columns.map((column) => {
                return <div className="Table-cell" key={column.id}>
                    <div className="Table-content">
                        {column.render(datum)}
                    </div>
                </div>;
            });
            return <div className="Table-row" key={rowNumber}>
                {cells}
            </div>;
        });
    }

    renderError(dataSource: DataSourceError) {
        return <Alert type="error" message={dataSource.error.message} />;
    }

    renderLoading() {
        // return <Spin tip="Loading data...">
        //     <Alert message="Loading Data"
        //         description="The data is loading for the table"
        //         type="info" />
        // </Spin>;
    }

    renderBodyOverlay() {
        switch (this.props.dataSource.status) {
            case AsyncProcessState.NONE:
            case AsyncProcessState.PROCESSING:
            case AsyncProcessState.REPROCESSING:
                return <div className="Table-body-processing-overlay">
                    <div className="Table-spin-container">
                        <Spin tip="Fetching table data..." style={{ maxWidth: '30em' }}>

                        </Spin>
                    </div>
                </div>;
            case AsyncProcessState.SUCCESS:
            case AsyncProcessState.ERROR:
        }
    }

    renderBody() {
        const content = (() => {
            switch (this.props.dataSource.status) {
                case AsyncProcessState.NONE:
                    return this.renderLoading();
                case AsyncProcessState.PROCESSING:
                    return this.renderLoading();
                case AsyncProcessState.REPROCESSING:
                    return this.renderTableRows(this.props.dataSource);
                case AsyncProcessState.SUCCESS:
                    return this.renderTableRows(this.props.dataSource);
                case AsyncProcessState.ERROR:
                    return this.renderError(this.props.dataSource);
            }
        })();

        return <div className="Table-body" ref={this.bodyRef}>
            {this.renderBodyOverlay()}
            {content}
        </div>;
    }

    renderNav() {
        if (this.state.status === TableStatus.OK) {
            switch (this.props.dataSource.status) {
                case AsyncProcessState.NONE:
                    return <TableNav state={{ enabled: false }} noun={this.props.noun} />;
                case AsyncProcessState.PROCESSING:
                    return <TableNav state={{ enabled: false }} noun={this.props.noun} />;
                case AsyncProcessState.REPROCESSING:
                case AsyncProcessState.SUCCESS:
                    return <TableNav
                        state={{
                            enabled: true,
                            page: this.props.dataSource.page,
                            pageCount: this.props.dataSource.pageCount,
                            total: this.props.dataSource.total,
                            firstPage: this.props.firstPage,
                            previousPage: this.props.previousPage,
                            nextPage: this.props.nextPage,
                            lastPage: this.props.lastPage
                        }}
                        noun={this.props.noun}
                    />;
                case AsyncProcessState.ERROR:
                    return this.renderError(this.props.dataSource);
            }
        } else {
            return <TableNav state={{ enabled: false }} noun={this.props.noun} />;
        }
    }

    render() {
        return <div className="Table">
            {this.renderHeader()}
            {this.renderBody()}
            {this.renderNav()}
        </div>;
    }
}