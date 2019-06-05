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
import { AppStat, PublicAppStatsQuery, SearchState } from '../../redux/store';

configure({ adapter: new Adapter() });

it('renders without crashing', () => {
    const searchState: SearchState = SearchState.NONE;
    const appStats: Array<AppStat> = [];
    const onSearch: (query: PublicAppStatsQuery) => void = (query: PublicAppStatsQuery) => {
        return;
    };
    shallow(<Component searchState={searchState} appStats={appStats} onSearch={onSearch} />);
});
