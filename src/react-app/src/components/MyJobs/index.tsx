import { Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
import MyJobs from './view';

import { StoreState, Job, JobsSearchExpression, SearchState } from '../../redux/store';
import { myJobsSearch, myJobsRefreshSearch, myJobsCancelJob } from '../../redux/actions/myJobs';

export interface OwnProps {}

interface StateProps {
    jobs: Array<Job>;
    searchState: SearchState;
}

interface DispatchProps {
    search: (searchExpression: JobsSearchExpression) => void;
    cancelJob: (jobID: string) => void;
    refreshSearch: () => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        views: {
            myJobsView: { searchState, jobs }
        }
    } = state;
    return { jobs, searchState };
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
