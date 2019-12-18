import { Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
import UserJobs from './view';

import {
    StoreState, JobsSearchExpression, UserJobsViewData
} from '../../redux/store';
import {
    userJobsSearch, userJobsRefreshSearch, userJobsCancelJob
} from '../../redux/actions/userJobs';
import { ComponentLoadingState } from '../../redux/store/base';

export interface OwnProps {
}

interface StateProps {
    view: UserJobsViewData
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
            userJobsView
        }
    } = state;

    if (userJobsView.loadingState !== ComponentLoadingState.SUCCESS) {
        throw new Error('Should never get here');
    }

    if (!userAuthorization) {
        throw new Error('Not authorized!');
    }

    return {
        view: userJobsView.data
    };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {
        search: (searchExpression: JobsSearchExpression) => {
            dispatch(userJobsSearch(searchExpression) as any);
        },
        cancelJob: (jobID: string) => {
            dispatch(userJobsCancelJob(jobID) as any);
        },
        refreshSearch: () => {
            dispatch(userJobsRefreshSearch() as any);
        }
    };
}

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(UserJobs);
