import { Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
import MyJobs from './view';

import { StoreState, Job, JobsSearchExpression, SearchState } from '../../redux/store';
import { myJobsSearch, myJobsRefreshSearch, myJobsCancelJob } from '../../redux/actions/myJobs';

export interface OwnProps { }

interface StateProps {
    jobs: Array<Job>;
    searchState: SearchState;
    showMonitoringControls: boolean;
}

interface DispatchProps {
    search: (searchExpression: JobsSearchExpression) => void;
    cancelJob: (jobID: string) => void;
    refreshSearch: () => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        auth: { userAuthorization },
        views: {
            myJobsView: { searchState, jobs }
        }
    } = state;

    if (!userAuthorization) {
        throw new Error('Not authorized!');
    }

    const { roles } = userAuthorization
    const showMonitoringControls = roles.some((role) => {
        return role === 'DevToken';
    })

    return { jobs, searchState, showMonitoringControls };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {
        search: (searchExpression: JobsSearchExpression) => {
            dispatch(myJobsSearch(searchExpression) as any);
        },
        cancelJob: (jobID: string) => {
            dispatch(myJobsCancelJob(jobID) as any);
        },
        refreshSearch: () => {
            dispatch(myJobsRefreshSearch() as any);
        }
    };
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(MyJobs);
