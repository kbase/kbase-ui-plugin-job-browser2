import React, { ReactNode } from 'react';
import './Table.css';
import { Alert, Spin, Empty, Modal, Button } from 'antd';
import TableNav, { Term } from './TableNav';
import { JSONValue, isJSONObject, isJSONArray } from '../../redux/types/json';

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
    error: {
        code: number,
        message: string,
        data?: JSONValue;
    };
}

export type DataSource<D> =
    DataSourceNone |
    DataSourceProcessing |
    DataSourceSuccess<D> |
    DataSourceReprocessing<D> |
    DataSourceError;

// export class DataSourceException extends Error { }

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
    reset: () => void;
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
    showError: boolean;
}

export default class Table2<D> extends React.Component<TableProps<D>, Table2State> {
    bodyRef: React.RefObject<HTMLDivElement>;
    resizing: boolean;

    constructor(props: TableProps<D>) {
        super(props);
        this.bodyRef = React.createRef();
        this.resizing = false;
        this.state = {
            status: TableStatus.NONE,
            showError: false
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
                    return (() => {
                        const newPageCount = Math.ceil(this.props.dataSource.total / rowsPerPage);
                        if (this.props.dataSource.page > newPageCount) {
                            return {
                                rowsPerPage,
                                currentPage: newPageCount,
                                pageCount: newPageCount
                            };
                        } else {
                            return {
                                rowsPerPage,
                                currentPage: null,
                                pageCount: newPageCount
                            };
                        }
                    })();

                case AsyncProcessState.ERROR:
                    return {
                        rowsPerPage,
                        currentPage: null,
                        pageCount: null
                    };
                case AsyncProcessState.SUCCESS:
                    return (() => {
                        const newPageCount = Math.ceil(this.props.dataSource.total / rowsPerPage);
                        if (this.props.dataSource.page > newPageCount) {
                            return {
                                rowsPerPage,
                                currentPage: newPageCount,
                                pageCount: newPageCount
                            };
                        } else {
                            return {
                                rowsPerPage,
                                currentPage: null,
                                pageCount: newPageCount
                            };
                        }
                    })();
            }
        })();
        this.props.config(config);
    }

    // calcRowsPerPage(): Promise<number> {
    //     return new Promise<number>((resolve, reject) => {
    //         let tries = 20;
    //         const start = new Date().getTime();
    //         const loop = () => {
    //             window.setTimeout(() => {
    //                 const body = this.bodyRef.current;
    //                 const elapsed = new Date().getTime() - start;
    //                 if (body === null) {
    //                     // throw new Error('No table body!');
    //                     if (tries === 0) {
    //                         console.log('body???', this.bodyRef);
    //                         reject(new Error(`Table body not found after ${elapsed}ms`));
    //                     }
    //                     tries -= 1;
    //                     loop();
    //                 } else {
    //                     const height = body.offsetHeight;
    //                     resolve(Math.floor(height / ROW_HEIGHT));
    //                 }
    //             }, 100);
    //         };
    //         loop();
    //     });

    // }

    calcRowsPerPage(): number {
        const body = this.bodyRef.current;
        if (body === null) {
            throw new Error('Table body not found');
        } else {
            const height = body.offsetHeight;
            return Math.floor(height / ROW_HEIGHT);
        }
    }

    // mouseHeldListener() {
    //     console.log('mouse held down?');
    //     window.removeEventListener('mouseup', this.mouseHeldListener);
    // }

    resizeListener() {
        // window.addEventListener('mouseup', this.mouseHeldListener.bind(this));
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
            try {
                this.setRowsPerPage();
            } catch (ex) {
                console.warn('Error setting rows per page...', ex);
            }
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

    renderJSON(value: JSONValue) {
        if (isJSONObject(value)) {
            const rows = Object.entries(value).map(([key, value]) => {
                return <tr key={key}>
                    <th>{key}</th>
                    <td><div className="JSON">{this.renderJSON(value)}</div></td>
                </tr>;
            });
            return <table className="JSONObject">
                <tbody>{rows}</tbody>
            </table>;
        } else if (isJSONArray(value)) {
            const rows = value.map((element, index) => {
                return <div key={index}>{this.renderJSON(element)}</div>;
            });
            return <div className="JSONArray">{rows}</div>;
        } else {
            switch (typeof value) {
                case 'string':
                    return <span className="JSONString">{value}</span>;
                case 'boolean':
                    const booleanString = value ? "true" : "false";
                    return <span className="JSONBoolean">{booleanString}</span>;
                case 'number':
                    return <span className="JSONNumber">{String(value)}</span>;
                case 'object':
                    if (value === null) {
                        return <span className="JSONNull">{String(value)}</span>;
                    } else {
                        throw new Error('Unsupported json object type: ' + (typeof value));
                    }
                default:
                    throw new Error('Unsupported json value type: ' + (typeof value));
            }
        }
    }

    renderError(dataSource: DataSourceError) {
        // const showDetail = () => {
        //     let content;
        //     if (dataSource.error.data) {
        //         content = <div>
        //             <div>Code: {dataSource.error.code}</div>
        //             <div>Message: {dataSource.error.message}</div>
        //             <div>Data:</div>
        //             <div
        //                 className="JSON"
        //                 style={{
        //                     maxHeight: '20em',
        //                     overflow: 'auto'
        //                 }}>
        //                 {this.renderJSON(dataSource.error.data)}
        //             </div>
        //         </div>;
        //     } else {
        //         content = 'n/a';
        //     }
        //     Modal.error({
        //         title: 'Error Details',
        //         style: {
        //             maxWidth: '50em',
        //             top: '20px',
        //             flex: '1 1 0px'
        //         },
        //         bodyStyle: {
        //             height: '80%'
        //         },
        //         width: '50em',
        //         onOk: () => {
        //             this.setState({
        //                 showError: false
        //             });
        //         },
        //         content
        //     });
        // };
        const showDetail = () => {
            this.setState({
                showError: true
            });
        };
        return <>
            <Alert
                type="error"
                showIcon
                message={`${dataSource.error.message} (${dataSource.error.code})`}
                description={
                    <div>
                        <Button onClick={showDetail}>
                            Detail
                        </Button>
                        <Button onClick={this.props.reset}>
                            Reset
                        </Button>
                    </div>
                }
            />
            {this.renderErrorModal(dataSource)}
        </>;
    }

    renderErrorModal(dataSource: DataSourceError) {
        const description = <div style={{
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div>Code: {dataSource.error.code}</div>
            <div>Message: {dataSource.error.message}</div>
            <div>Data:</div>
            <div
                className="JSON"
                style={{
                    overflow: 'auto',
                    flex: '1 1 0px'
                }}>
                {dataSource.error.data && this.renderJSON(dataSource.error.data)}
            </div>
        </div>;
        return <Modal
            title="Error Details"
            visible={this.state.showError}
            className="FullHeightModal"
            onCancel={() => {
                this.setState({
                    showError: false
                });
            }}
            style={{
                maxWidth: '50em',
                top: '20px',
                bottom: '20px',
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }}
            width="50em"
            bodyStyle={{
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }}

            footer={[
                <Button key="done"
                    onClick={() => {
                        this.setState({
                            showError: false
                        });
                    }}>
                    Done
                </Button>,
                <Button key="reset"
                    onClick={() => {
                        this.setState({
                            showError: false
                        });
                        this.props.reset();
                    }}>
                    Reset
                </Button>
            ]}
        >
            {description}
        </Modal>;
    }

    /*
    
    */

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
                    return <TableNav state={{ enabled: false }} noun={this.props.noun} />;
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