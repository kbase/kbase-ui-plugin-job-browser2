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
import { SearchState, JobsSearchExpression, Job, JobStatus } from '../../redux/store';

configure({ adapter: new Adapter() });

// it('renders without crashing', () => {
//     const jobs: Array<Job> = [];
//     const searchState: SearchState = SearchState.NONE;
//     const search: (searchExpression: JobsSearchExpression) => void = (searchExpression: JobsSearchExpression) => {
//         return;
//     };
//     const cancelJob: (jobID: string) => void = (jobId: string) => {
//         return;
//     };
//     const component = mount(<Component jobs={jobs} searchState={searchState} search={search} cancelJob={cancelJob} />);
//     component.unmount();
// });

const jobs: Array<Job> = [
    {
        id: 'jobid1',
        appID: '123',
        appTitle: 'App Title',
        narrativeID: 123,
        narrativeTitle: 'Narative title',
        key: 'jobid1',
        clientGroups: ['njs'],
        queuedAt: 12345,
        runAt: 12345,
        finishAt: 12345,
        status: JobStatus.FINISHED,
        message: 'some message',
        queuedElapsed: 12345,
        runElapsed: 12345,
        username: 'mmouse',
        log: {
            isLoaded: false,
            lines: []
        }
    },
    {
        id: 'jobid2',
        appID: '123',
        appTitle: 'App Title',
        narrativeID: 123,
        narrativeTitle: 'Narative title',
        key: 'jobid2',
        clientGroups: ['njs'],
        queuedAt: 12345,
        runAt: 12345,
        finishAt: 12345,
        status: JobStatus.FINISHED,
        message: 'some message',
        queuedElapsed: 12345,
        runElapsed: 12345,
        username: 'mmouse',
        log: {
            isLoaded: false,
            lines: []
        }
    },
    {
        id: 'jobid3',
        appID: '123',
        appTitle: 'App Title',
        narrativeID: 123,
        narrativeTitle: 'Narative title',
        key: 'jobid3',
        clientGroups: ['njs'],
        queuedAt: 12345,
        runAt: 12345,
        finishAt: 12345,
        status: JobStatus.RUNNING,
        message: 'some message',
        queuedElapsed: 12345,
        runElapsed: 12345,
        username: 'mmouse',
        log: {
            isLoaded: false,
            lines: []
        }
    },
    {
        id: 'jobid4',
        appID: '123',
        appTitle: 'App Title',
        narrativeID: 123,
        narrativeTitle: 'Narative title',
        key: 'jobid4',
        clientGroups: ['njs'],
        queuedAt: 12345,
        runAt: 12345,
        finishAt: 12345,
        status: JobStatus.QUEUED,
        message: 'some message',
        queuedElapsed: 12345,
        runElapsed: 12345,
        username: 'mmouse',
        log: {
            isLoaded: false,
            lines: []
        }
    },
    {
        id: 'jobid5',
        appID: '123',
        appTitle: 'App Title',
        narrativeID: 123,
        narrativeTitle: 'Narative title',
        key: 'jobid5',
        clientGroups: ['njs'],
        queuedAt: 12345,
        runAt: 12345,
        finishAt: 12345,
        status: JobStatus.ERRORED,
        message: 'some message',
        queuedElapsed: 12345,
        runElapsed: 12345,
        username: 'mmouse',
        log: {
            isLoaded: false,
            lines: []
        }
    },
    {
        id: 'jobid6',
        appID: '123',
        appTitle: 'App Title',
        narrativeID: 123,
        narrativeTitle: 'Narative title',
        key: 'jobid6',
        clientGroups: ['njs'],
        queuedAt: 12345,
        runAt: 12345,
        finishAt: 12345,
        status: JobStatus.CANCELED,
        message: 'some message',
        queuedElapsed: 12345,
        runElapsed: 12345,
        username: 'mmouse',
        log: {
            isLoaded: false,
            lines: []
        }
    }
];

// it('renders some results', () => {
//     const searchState: SearchState = SearchState.SEARCHED;
//     const search: (searchExpression: JobsSearchExpression) => void = (searchExpression: JobsSearchExpression) => {
//         console.log('Searching !', searchExpression);
//         return;
//     };
//     const cancelJob: (jobID: string) => void = (jobId: string) => {
//         return;
//     };
//     const component = mount(<Component jobs={jobs} searchState={searchState} search={search} cancelJob={cancelJob} />);
//     component.unmount();
// });

it('renders some results, then click filter all', () => {
    const searchState: SearchState = SearchState.SEARCHED;
    const search: (searchExpression: JobsSearchExpression) => void = (searchExpression: JobsSearchExpression) => {
        return;
    };
    const cancelJob: (jobID: string) => void = (jobId: string) => {
        return;
    };
    const component = mount(<Component jobs={jobs} searchState={searchState} search={search} cancelJob={cancelJob} />);
    const anyButton = component.find('[data-k-b-testhook-button="any"]').hostNodes();
    expect(anyButton).toHaveLength(1);
    anyButton.simulate('click');
    component.unmount();
});

it('renders some results, then the click "filter active" button', () => {
    const searchState: SearchState = SearchState.SEARCHED;
    const search: (searchExpression: JobsSearchExpression) => void = (searchExpression: JobsSearchExpression) => {
        return;
    };
    const cancelJob: (jobID: string) => void = (jobId: string) => {
        return;
    };
    const component = mount(<Component jobs={jobs} searchState={searchState} search={search} cancelJob={cancelJob} />);
    const button = component.find('[data-k-b-testhook-button="active"]').hostNodes();
    expect(button).toHaveLength(1);
    button.simulate('click');
    component.unmount();
});

it('renders some results, then the click "filter finished" button', () => {
    const searchState: SearchState = SearchState.SEARCHED;
    const search: (searchExpression: JobsSearchExpression) => void = (searchExpression: JobsSearchExpression) => {
        return;
    };
    const cancelJob: (jobID: string) => void = (jobId: string) => {
        return;
    };
    const component = mount(<Component jobs={jobs} searchState={searchState} search={search} cancelJob={cancelJob} />);
    const button = component.find('[data-k-b-testhook-button="finished"]').hostNodes();
    expect(button).toHaveLength(1);
    button.simulate('click');
    component.unmount();
});

async function retryLoop(fun: () => any, maxTime: number): Promise<any> {
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
        function loop() {
            if (Date.now() - startedAt > maxTime) {
                reject('timed out after ' + maxTime + 'ms');
            }
            window.setTimeout(() => {
                try {
                    const succeeded = fun();
                    if (succeeded) {
                        resolve(succeeded);
                    } else {
                        loop();
                    }
                } catch (ex) {
                    reject(ex);
                }
            }, 100);
        }
        loop();
    });
}

it('renders some results, then cancel a running job', async (done) => {
    const searchState: SearchState = SearchState.SEARCHED;
    const search: (searchExpression: JobsSearchExpression) => void = (searchExpression: JobsSearchExpression) => {
        return;
    };
    let canceled = false;
    const cancelJob: (jobID: string) => void = (jobId: string) => {
        canceled = true;
        return;
    };
    const component = mount(<Component jobs={jobs} searchState={searchState} search={search} cancelJob={cancelJob} />);
    const button = component.find('[data-row-key="jobid3"] [data-k-b-testhook-button="cancel"]').hostNodes();
    expect(button).toHaveLength(1);
    button.simulate('click');
    const didItWork = await retryLoop(() => {
        return canceled;
    }, 1000);
    expect(didItWork).toEqual(true);
    component.unmount();
    done();
});
