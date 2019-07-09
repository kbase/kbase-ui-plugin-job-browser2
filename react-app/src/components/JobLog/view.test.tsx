/**
 * Unit tests for the KBaseIntegration component
 */

// We need to import React, even though we don't explicity use it, because
// it's presence is required for JSX transpilation (the React object is
// used  in the transpiled code)
import React from 'react';
// Enzyme needs
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// We always need to import the component we are testing
import Component from './view';
import { JobLog } from '../../redux/store';

configure({ adapter: new Adapter() });

it('renders without crashing', () => {
    const jobLog: JobLog = {
        isLoaded: false,
        lines: []
    };
    shallow(<Component log={jobLog} />);
});

it('renders several lines', () => {
    const jobLog: JobLog = {
        isLoaded: false,
        lines: [
            {
                isError: false,
                lineNumber: 1,
                line: 'first line'
            },
            {
                isError: false,
                lineNumber: 2,
                line: 'second line'
            },
            {
                isError: false,
                lineNumber: 3,
                line: 'third line'
            }
        ]
    };
    const theComponent = mount(<Component log={jobLog} />);
    theComponent.unmount();
});

it('renders several lines including an error', () => {
    const jobLog: JobLog = {
        isLoaded: false,
        lines: [
            {
                isError: false,
                lineNumber: 1,
                line: 'first line'
            },
            {
                isError: false,
                lineNumber: 2,
                line: 'second line'
            },
            {
                isError: true,
                lineNumber: 3,
                line: 'third line'
            }
        ]
    };
    const theComponent = mount(<Component log={jobLog} />);
    theComponent.unmount();
});
