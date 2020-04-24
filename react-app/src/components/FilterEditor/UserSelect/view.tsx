import React from 'react';
import { OptionValue } from '../../../lib/types';
import Select from 'antd/lib/select';

export interface UserSelectProps {
    options: Array<OptionValue<string>>;
    changed: (apps: Array<string>) => void;
    search: (term: string) => void;
    defaultValue?: Array<string>;
}

interface UserSelectState {

}

export default class UserSelect extends React.Component<UserSelectProps, UserSelectState> {

    onChange(value: string) {
        // oddly enough, clearing a field will set value
        // to undefined :(
        // TODO: either file a bug report w/ ant design, or switch to antd 4 and
        // see if it is fixed.
        if (typeof value === 'undefined') {
            value = '';
        }
        if (value.length === 0) {
            this.props.changed([]);
        } else {
            this.props.changed([value]);
        }
    }

    onSearch(value: string) {
        console.log('search for', value);
        this.props.search(value);
    }

    renderUserSelector() {
        const options = this.props.options
            .map((option) => {
                return <Select.Option
                    key={option.value}
                    value={option.value}>{option.label}</Select.Option>;
            });
        const defaultValue = this.props.defaultValue ? this.props.defaultValue[0] : undefined;
        return <Select<string>
            showSearch
            allowClear
            onChange={this.onChange.bind(this)}
            onSearch={this.onSearch.bind(this)}
            defaultValue={defaultValue}
        // filterOption={(filterTerm, option) => {
        //     if (!option.props.children) {
        //         return true;
        //     }
        //     return String(option.props.children).toLowerCase().indexOf(filterTerm.toLowerCase()) >= 0;
        // }}
        >
            {options}
        </Select>;
    }
    render() {
        return this.renderUserSelector();
    }
}