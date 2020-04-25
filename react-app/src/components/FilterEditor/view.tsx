import React from 'react';
import { Form, Button, Select, Checkbox } from 'antd';
import { JobSearchStatus } from '../../redux/store';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { OptionValue } from '../../lib/types';
import { JobStatus, FilterSpec } from '../../lib/JobBrowserBFFClient';
import NarrativeSelect from './NarrativeSelect';
import AppSelect from './AppSelect';
import AppFunctionSelect from './AppFunctionSelect';
import AppModuleSelect from './AppModuleSelect';
import UserSelect from './UserSelect';

/**
 * A set of job status filter options used to populate and control a set of checkboxes provided
 * for the user to be able to filter jobs according to their job status.
 *
 * Note that this is a set of options because the antd checkboxgroup simplifies a set of checkboxes
 * through sets of options.
 */
const jobStatusFilterOptions: Array<OptionValue<JobStatus>> = [
    {
        label: 'Created',
        value: 'create'
    },
    {
        label: 'Queued',
        value: 'queue'
    },
    {
        label: 'Running',
        value: 'run'
    },
    {
        label: 'Completed',
        value: 'complete'
    },
    {
        label: 'Error',
        value: 'error'
    },
    {
        label: 'Canceled',
        value: 'terminate'
    }
];

export interface FilterEditorProps {
    onChange: (filter: FilterSpec) => void;
    filter: FilterSpec;
}

interface FilterEditorState {
    filter: FilterSpec;
}

export default class FilterEditor extends React.Component<FilterEditorProps, FilterEditorState> {
    constructor(props: FilterEditorProps) {
        super(props);
        this.state = {
            filter: this.props.filter,
        };
    }

    /* Actions */
    onApply() {
        this.props.onChange(this.state.filter);
    }

    onReset() {
        this.setState({
            filter: this.props.filter
        });
    }

    onClickAny() {
        this.setState({
            filter: {
                ...this.state.filter,
                status: ['create', 'queue', 'run', 'terminate', 'complete', 'error']
            }
        });
    }

    onClickFinished() {
        this.setState({
            filter: {
                ...this.state.filter,
                status: ['terminate', 'complete', 'error']
            }
        });
    }

    onClickActive() {
        this.setState({
            filter: {
                ...this.state.filter,
                status: ['create', 'queue', 'run']
            }
        });
    }

    onFilterChange(filters: Array<CheckboxValueType>) {
        const filter = filters as Array<JobSearchStatus>;
        this.setState({
            filter: {
                ...this.state.filter,
                status: filter
            }
        });
    }

    onChangeJobStatusAny(event: CheckboxChangeEvent) {
        this.setState({
            filter: {
                ...this.state.filter,
                status: ['create', 'queue', 'run', 'terminate', 'complete', 'error']
            }
        });
    }

    onUserChanged(users: Array<string>) {
        this.setState({
            filter: {
                ...this.state.filter,
                user: users
            }
        });
    }



    /* Rendering */
    renderUserSelector() {
        return <UserSelect
            defaultValue={this.state.filter.user}
            changed={this.onUserChanged.bind(this)} />;
    }

    onAppSelect(apps: Array<string>) {
        this.setState({
            filter: {
                ...this.state.filter,
                app_id: apps
            }
        });
    }

    renderAppSelector() {
        return <AppSelect
            defaultValue={this.state.filter.app_id}
            onChange={this.onAppSelect.bind(this)} />;
    }
    onAppModuleSelect(modules: Array<string>) {
        this.setState({
            filter: {
                ...this.state.filter,
                app_module: modules
            }
        });
    }
    renderAppModuleSelector() {
        return <AppModuleSelect
            defaultValue={this.state.filter.app_module}
            onChange={this.onAppModuleSelect.bind(this)} />;
    }

    onAppFunctionSelect(apps: Array<string>) {
        this.setState({
            filter: {
                ...this.state.filter,
                app_function: apps
            }
        });
    }

    renderAppFunctionSelector() {
        return <AppFunctionSelect
            defaultValue={this.state.filter.app_function}
            onChange={this.onAppFunctionSelect.bind(this)} />;
    }

    renderClientGroupSelector() {
        const data = [
            {
                label: 'My ClientGroup',
                value: 'my-value'
            }
        ];
        const options = data.map(({ value, label }) => {
            return <Select.Option
                key={value}
                value={value}>{label}</Select.Option>;
        });
        return <Select >
            {options}
        </Select>;
    }

    renderStatusField() {
        const options = jobStatusFilterOptions;
        return <>
            <Button size="small" type="link" onClick={this.onClickAny.bind(this)} data-k-b-testhook-button="any">
                <i>Any</i>
            </Button>{" "}
            <Button size="small" type="link" onClick={this.onClickActive.bind(this)} data-k-b-testhook-button="active">
                <i>Active</i>
            </Button>{" "}
            <Button
                size="small"
                type="link"
                onClick={this.onClickFinished.bind(this)}
                style={{ marginRight: "10px" }}
                data-k-b-testhook-button="finished"
            >
                <i>Finished</i>
            </Button>
            <Checkbox.Group
                options={options}
                onChange={this.onFilterChange.bind(this)}
                value={this.state.filter.status}
            />
        </>;
    }

    onNarrativeSelect(narrativeIds: Array<number>) {
        this.setState({
            filter: {
                ...this.state.filter,
                workspace_id: narrativeIds
            }
        });
    }

    renderNarrativeSelector() {
        return <NarrativeSelect
            defaultValue={this.state.filter.workspace_id}
            onChange={this.onNarrativeSelect.bind(this)} />;
    }

    renderFilterInput() {
        // const layout = {
        //     labelCol: {
        //         xs: { span: 24 },
        //         sm: { span: 8 },
        //     },
        //     wrapperCol: {
        //         xs: { span: 24 },
        //         sm: { span: 16 },
        //     },
        // };
        const layout = {
            labelCol: {
                span: 4
            },
            wrapperCol: {
                span: 20
            }
        };
        const tailLayout = {
            wrapperCol: {
                span: 24
            }
        };
        return <div className="MyJobs-filterArea-fieldFilters">
            <Form {...layout}>
                <Form.Item label="Status">
                    {this.renderStatusField()}
                </Form.Item>
                <Form.Item label="Narrative">
                    {this.renderNarrativeSelector()}
                </Form.Item>
                <Form.Item label="User" >
                    {this.renderUserSelector()}
                </Form.Item>
                <Form.Item label="App" >
                    {this.renderAppSelector()}
                </Form.Item>
                <Form.Item label="App Module" >
                    {this.renderAppModuleSelector()}
                </Form.Item>
                <Form.Item label="App Function" >
                    {this.renderAppFunctionSelector()}
                </Form.Item>
                <Form.Item label="Client Group" >
                    {this.renderClientGroupSelector()}
                </Form.Item>
                <Form.Item {...tailLayout} style={{ textAlign: 'center' }}>
                    <Button.Group>
                        <Button type="primary" onClick={this.onApply.bind(this)}>
                            Apply
                        </Button>
                        <Button onClick={this.onReset.bind(this)}>
                            Reset
                        </Button>
                    </Button.Group>
                </Form.Item>
            </Form>


        </div>;
    }

    render() {
        return this.renderFilterInput();
    }
}