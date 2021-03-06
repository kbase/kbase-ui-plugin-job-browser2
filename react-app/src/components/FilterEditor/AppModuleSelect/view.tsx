import React from 'react';
import { OptionValue } from '../../../lib/types';
import Select from 'antd/lib/select';

export interface AppModuleSelectProps {
    options: Array<OptionValue<string>>;
    onChange: (apps: Array<string>) => void;
    defaultValue?: Array<string>;
}

interface AppModuleSelectState {

}

export default class AppModuleSelect extends React.Component<AppModuleSelectProps, AppModuleSelectState> {

    onChange(value: string) {
        // oddly enough, clearing a field will set value
        // to undefined :(
        // TODO: either file a bug report w/ ant design, or switch to antd 4 and
        // see if it is fixed.
        if (typeof value === 'undefined') {
            value = '';
        }
        if (value.length === 0) {
            this.props.onChange([]);
        } else {
            this.props.onChange([value]);
        }
    }

    renderAppModuleSelector() {
        const options = this.props.options
            .map((option) => {
                return <Select.Option
                    key={option.value}
                    value={option.value}>{option.label}</Select.Option>;
            });

        const defaultValue = this.props.defaultValue ? this.props.defaultValue[0] : undefined;
        return <Select<string>
            showSearch
            onChange={this.onChange.bind(this)}
            allowClear
            defaultValue={defaultValue}
            filterOption={(filterTerm, option) => {
                if (!option) {
                    return true;
                }
                if (!option.props.children) {
                    return true;
                }
                return String(option.props.children).toLowerCase().indexOf(filterTerm.toLowerCase()) >= 0;
            }}
        >
            {options}
        </Select>;
    }
    render() {
        return this.renderAppModuleSelector();
    }
}