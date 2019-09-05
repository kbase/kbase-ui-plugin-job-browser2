import { NarrativeJobServiceClient } from '@kbase/ui-lib';
import { JobID, Job } from '../redux/store';

interface ConstructorParam {
    token: string;
    url: string;
}
export default class NarrativeJobServiceModel {
    token: string;
    url: string;
    constructor({ token, url }: ConstructorParam) {
        this.token = token;
        this.url = url;
    }

    // async getJob(jobID: JobID): Promise<Job> {
    //     const njsClient = new NarrativeJobServiceClient({
    //         token: this.token,
    //         url: this.url,
    //         module: 'NarrativeJobService'
    //     });
    //     const [job] = await njsClient.checkJob(jobID);


    //     return {
    //         id: job.job_id,
    //         key: job.job_id,
    //         narrativeID
    //     }
    // }
}