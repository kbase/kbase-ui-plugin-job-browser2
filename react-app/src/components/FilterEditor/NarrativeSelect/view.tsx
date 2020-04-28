import React from 'react';
import { OptionValue } from '../../../lib/types';
import Select from 'antd/lib/select';

export interface NarrativeSelectProps {
    narratives: Array<OptionValue<number>>;
    onChange: (narratives: Array<number>) => void;
    defaultValue?: Array<number>;
}

interface NarrativeSelectState {

}

export default class NarrativeSelect extends React.Component<NarrativeSelectProps, NarrativeSelectState> {

    onChange(value: number) {
        // oddly enough, clearing a field will set value
        // to undefined :(
        // TODO: either file a bug report w/ ant design, or switch to antd 4 and
        // see if it is fixed.
        if (typeof value === 'undefined') {
            this.props.onChange([]);
        } else {
            this.props.onChange([value]);
        }
    }

    renderNarrativeSelector() {
        const narrativeOptions = this.props.narratives
            .map((narrative) => {
                return <Select.Option
                    key={narrative.value}
                    value={narrative.value}>{narrative.label}</Select.Option>;
            });

        const defaultValue = this.props.defaultValue ? this.props.defaultValue[0] : undefined;

        return <Select<number>
            showSearch
            allowClear
            defaultValue={defaultValue}
            onChange={this.onChange.bind(this)}
            filterOption={(filterTerm, option) => {
                if (!option.props.children) {
                    return true;
                }
                return String(option.props.children).toLowerCase().indexOf(filterTerm.toLowerCase()) >= 0;
            }}
        >
            {narrativeOptions}
        </Select>;
    }
    render() {
        return this.renderNarrativeSelector();
    }
}