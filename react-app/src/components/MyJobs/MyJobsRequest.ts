import { Job, JobsSearchExpression } from "../../redux/store";
import CancelableRequest, { Task } from "../../lib/CancelableRequest";
import JobBrowserBFFClient, { QueryJobsParams } from "../../lib/JobBrowserBFFClient";
import { extractTimeRange, serviceJobToUIJob } from "../../redux/actions/utils";



interface MyJobsParam {
    token: string,
    searchExpression: JobsSearchExpression;
    username: string,
    serviceWizardURL: string,
    // from: number,
    // to: number,
    // offset: number,
    // limit: number
}

type MyJobsResult = {
    jobs: Array<Job>,
    foundCount: number,
    totalCount: number;
};

export default class MyJobsRequest extends CancelableRequest<MyJobsParam, MyJobsResult> {
    request({ token, searchExpression, username, serviceWizardURL }: MyJobsParam): Task<MyJobsResult> {
        const jobBrowserBFF = new JobBrowserBFFClient({
            token,
            url: serviceWizardURL,
        });

        const [timeRangeStart, timeRangeEnd] = extractTimeRange(searchExpression.timeRange);

        // const filter: FilterSpec = {
        //     status: searchExpression.jobStatus
        // };

        // TODO: better parsing of search, or do it before here...
        // const searchTerms = searchExpression.query.split(/\s+/);
        // TODO: remove - experiment with passing a search
        // as a filter.
        // if (searchTerms.length > 0) {
        //     if (!(searchTerms.length === 1 && searchTerms[0] === '')) {
        //         filter.user = searchTerms;
        //     }
        // }

        const queryParams: QueryJobsParams = {
            time_span: {
                from: timeRangeStart,
                to: timeRangeEnd
            }, // TODO: really handle sort
            offset: searchExpression.offset,
            limit: searchExpression.limit,
            timeout: 10000,
            // search: {
            //     terms: searchTerms
            // },
            filter: searchExpression.filter
        };

        if (searchExpression.sort) {
            switch (searchExpression.sort.field) {
                case 'created':
                    queryParams.sort = [{
                        key: 'created',
                        direction: searchExpression.sort.direction
                    }];
            }
        }

        const promise = jobBrowserBFF
            .query_jobs(queryParams)
            .then(({ jobs, found_count, total_count }) => {
                return {
                    jobs: jobs.map((jobInfo) => {
                        return serviceJobToUIJob(jobInfo, username);
                    }),
                    foundCount: found_count,
                    totalCount: total_count
                };
            });

        const task: Task<MyJobsResult> = {
            id: this.newID(),
            promise,
            isCanceled: false
        };
        this.pendingTasks.set(task.id, task);
        return task;
    }
}