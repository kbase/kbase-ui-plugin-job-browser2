/**
 * Unit tests for the KBaseIntegration component
 */

// We need to import React, even though we don't explicity use it, because
// it's presence is required for JSX transpilation (the React object is
// used  in the transpiled code)
import React from 'react';
// Enzyme needs
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// We always need to import the component we are testing
import Component from './view';
import { JobLog } from '../../redux/store';
import { MainParams } from './state';

configure({ adapter: new Adapter() });

it('renders without crashing', () => {
    const isAdmin: boolean = false;
    function setView(view: string) {
        return;
    }
    function setParams(params: MainParams) {
        return;
    }
    function setTitle(title: string) {
        return;
    }

    shallow(<Component view="main" params={{tab: 'myJobs'}} isAdmin={isAdmin} setView={setView} setParams={setParams} setTitle={setTitle} />);
});
