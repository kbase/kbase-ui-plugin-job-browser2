import { Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
import MyJobs from './view';

import {
    StoreState, JobsSearchExpression, MyJobsViewData
} from '../../redux/store';
import {
    myJobsSearch, myJobsRefreshSearch, myJobsCancelJob
} from '../../redux/actions/myJobs';
import { ComponentLoadingState } from '../../redux/store/base';

export interface OwnProps {
}

interface StateProps {
    view: MyJobsViewData;
}

interface DispatchProps {
    search: (searchExpression: JobsSearchExpression) => void;
    cancelJob: (jobID: string, timeout: number) => void;
    refreshSearch: () => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        auth: { userAuthorization },
        views: {
            myJobsView
        }
    } = state;

    if (myJobsView.loadingState !== ComponentLoadingState.SUCCESS) {
        throw new Error('Should never get here');
    }

    if (!userAuthorization) {
        throw new Error('Not authorized!');
    }


    // const showMonitoringControls = roles.some((role) => {
    //     return role === 'DevToken';
    // })
    // const showMonitoringControls = true;

    // const {
    //     searchResult: { jobs, foundCount, totalCount },
    //     searchExpression,
    //     searchState,
    // } = myJobsView.data;

    return {
        view: myJobsView.data
    };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {
        search: (searchExpression: JobsSearchExpression) => {
            dispatch(myJobsSearch(searchExpression) as any);
        },
        cancelJob: (jobID: string, timeout: number) => {
            dispatch(myJobsCancelJob(jobID, timeout) as any);
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
