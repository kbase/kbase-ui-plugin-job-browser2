import { Job, JobsSearchExpression } from "../../redux/store";
import CancelableRequest, { Task } from "../../lib/CancelableRequest";
import JobBrowserBFFClient, { QueryJobsParams } from "../../lib/JobBrowserBFFClient";
import { extractTimeRange, serviceJobToUIJob } from "../../redux/actions/utils";
import { SERVICE_TIMEOUT } from "../../constants";

interface UserJobsParam {
    token: string,
    searchExpression: JobsSearchExpression;
    username: string,
    serviceWizardURL: string;
}

type UserJobsResult = {
    jobs: Array<Job>,
    foundCount: number,
    totalCount: number;
};

export default class UserJobsRequest extends CancelableRequest<UserJobsParam, UserJobsResult> {
    request({ token, searchExpression, username, serviceWizardURL }: UserJobsParam): Task<UserJobsResult> {
        const jobBrowserBFF = new JobBrowserBFFClient({
            token,
            url: serviceWizardURL,
            timeout: SERVICE_TIMEOUT
        });

        const [timeRangeStart, timeRangeEnd] = extractTimeRange(searchExpression.timeRange);

        const queryParams: QueryJobsParams = {
            time_span: {
                from: timeRangeStart,
                to: timeRangeEnd
            }, // TODO: really handle sort
            offset: searchExpression.offset,
            limit: searchExpression.limit,
            timeout: SERVICE_TIMEOUT,
            filter: searchExpression.filter,
            admin: true
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

        const task: Task<UserJobsResult> = {
            id: this.newID(),
            promise,
            isCanceled: false
        };
        this.pendingTasks.set(task.id, task);
        return task;
    }
}