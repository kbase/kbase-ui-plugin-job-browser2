/**
 * A redux adapter container for the User Jobs view component.
 *
 * For those not familiar with redux-based apps: Redux exists as a parallel system to the react component hierarchy. The react "store" (database)
 * is established in the top level `App` component. A component can access the store data and the store actions through what is commonly
 * referred to as a "container" module. We prefer to call them "redux adapters", to be more specific.
 *
 * A redux adapter is a separate component file. It essentially creates a component (via the `connect` function) which "wraps" the underlying
 * view component. It extracts the data and action generators and supplies them to the view component.
 */

/**
 * Imports, ignore
 */
// 3rd party
import { Dispatch, Action } from 'redux';
import { connect } from 'react-redux';

// project
import UserJobs from './view';
import { StoreState, Job, JobsSearchExpression, SearchState } from '../../redux/store';
import { userJobsSearch, userJobsCancelJob } from '../../redux/actions/userJobs';

/**
 * The props which this redux adapter requires in it's invocation.
 *
 * Current empty
 */
export interface OwnProps { }

/**
 * The props this redux adapter extracts from the store and injects in
 * its call to the child component, UserJobs.
 *
 * @note These properties must exist in UserJobs.
 */
interface StateProps {
    jobs: Array<Job>;
    searchState: SearchState;
    showMonitoringControls: boolean;
    // searchExpression: JobsSearchExpression;
}

/**
 * The props this redux adapter extracts from actions and injects into
 * its call to the child component, UserJobs.
 *
 * @note These properties must exist in UserJobs.
 */
interface DispatchProps {
    search: (searchExpression: JobsSearchExpression) => void;
    cancelJob: (jobID: string) => void;
}

function mapStateToProps(state: StoreState, props: OwnProps): StateProps {
    const {
        auth: { userAuthorization },
        views: {
            userJobsView: { searchState, jobs }
        }
    } = state;

    if (!userAuthorization) {
        throw new Error('Not authorized!');
    }

    // const { roles } = userAuthorization
    // const showMonitoringControls = roles.some((role) => {
    //     return role === 'DevToken';
    // })
    const showMonitoringControls = true;
    return { jobs, searchState, showMonitoringControls };
}

function mapDispatchToProps(dispatch: Dispatch<Action>, ownProps: OwnProps): DispatchProps {
    return {
        search: (searchExpression: JobsSearchExpression) => {
            dispatch(userJobsSearch(searchExpression) as any);
        },
        cancelJob: (jobID: string) => {
            dispatch(userJobsCancelJob(jobID) as any);
        }
    };
}

const UserJobsReduxAdapter = connect<StateProps, DispatchProps, OwnProps, StoreState>(
    mapStateToProps,
    mapDispatchToProps
)(UserJobs);

export default UserJobsReduxAdapter;
