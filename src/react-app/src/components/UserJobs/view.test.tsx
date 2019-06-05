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
import { SearchState, JobsSearchExpression, Job } from '../../redux/store';

configure({ adapter: new Adapter() });

it('renders without crashing', () => {
    const jobs: Array<Job> = [];
    const searchState: SearchState = SearchState.NONE;
    const search: (searchExpression: JobsSearchExpression) => void = (searchExpression: JobsSearchExpression) => {
        return;
    };
    const cancelJob: (jobID: string) => void = (jobId: string) => {
        return;
    };
    const refreshSearch: () => void = () => {
        return;
    };
    shallow(
        <Component
            jobs={jobs}
            searchState={searchState}
            search={search}
            cancelJob={cancelJob}
            refreshSearch={refreshSearch}
        />
    );
});
