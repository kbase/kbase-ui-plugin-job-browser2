import { Dispatch, Action } from "redux";
import { connect } from "react-redux";
import MyJobs from "./view";

import { StoreState, Job, JobsSearchExpression, SearchState } from "../../redux/store";
import { myJobsSearch, myJobsRefreshSearch, myJobsCancelJob } from "../../redux/actions/myJobs";
import { AppError } from "@kbase/ui-components";

export interface OwnProps { }

interface StateProps {
    jobs: Array<Job>;
    error: AppError | null;
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
            myJobsView: { searchState, jobs, error }
        }
    } = state;

    if (!userAuthorization) {
        throw new Error("Not authorized!");
    }

    const showMonitoringControls = true;

    return { jobs, error, searchState, showMonitoringControls };
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

export default connect<StateProps, DispatchProps, OwnProps, StoreState>(mapStateToProps, mapDispatchToProps)(MyJobs);
