import {
    ServiceClientParams,
    ServiceClient
} from "../ServiceClient";

export interface User {
    username: string,
    realname: string,
    thumbnail: string;
}

export type OrganizationSetting = {
    settings: {
        lastVisitedAt: Date | null;
    };
};

export type OrganizationsSettings = {
    orgSettings: any; //Map<string, OrganizationSetting>
};

export interface UserProfile {
    user: User,
    profile: {
        synced: {
            gravatarHash: string;
        };
        userdata: {
            jobTitle: string,
            jobTitleOther: string,
            organization: string;
            city: string;
            state: string;
            country: string;
            avatarOption: string;
            gravatarDefault: string;
        };
        metadata: {
            createdBy: string;
            created: string;
        };
        plugins: {
            organizations?: OrganizationsSettings;
        };
    };
}

// Note that we are only supporting updating of the orgs plugin settings, 
// so make this strict-ish.
export interface UserProfileUpdate {
    user: User,
    profile: {
        plugins: {
            organizations: OrganizationsSettings;
        };
    };
}

export interface JSONPayload {
    version: string,
    method: string,
    id: string,
    params: any;
}


export interface UserProfileClientParams extends ServiceClientParams {
}

export class UserProfileClient extends ServiceClient {
    module: string = 'UserProfile';
    static profileCache: Map<string, UserProfile> = new Map();

    getVersion(): Promise<any> {
        return this.callFunc<null, string>('version', null);

        // const headers: HeadersInit =  {
        //     'Content-Type': 'application/json',
        //     Accept: 'application/json'
        // };
        // if (this.authorization) {
        //     headers.Authorization = this.authorization;
        // }
        // return fetch(this.url, {
        //     method: 'POST',
        //     mode: 'cors',
        //     cache: 'no-store',
        //     headers,
        //     body: JSON.stringify(this.makeEmptyPayload('version'))
        // })
        //     .then((response) => {
        //         if (response.status !== 200) {
        //             throw new Error('User profile request error: ' + response.status + ', ' + response.statusText);
        //         }
        //         return response.json();
        //     });
    }

    async getUserProfile(username: string): Promise<UserProfile> {
        if (UserProfileClient.profileCache.has(username)) {
            return Promise.resolve(UserProfileClient.profileCache.get(username)!);
        }
        const [result] = await this.callFunc('get_user_profile', [username]);
        return result[0];
    }

    async updateUserProfile(update: UserProfileUpdate): Promise<void> {
        // TODO: update user profile cache here...
        UserProfileClient.profileCache.delete(update.user.username);
        await this.callFunc('update_user_profile', { profile: update });
        return;
    }

    // async setUserProfile(username: string, profile: UserProfile): Promise<void> {
    //     // TODO: update user profile cache here...
    //     this.callFunc('update_user_profile', profile)
    // }

    async getUserProfiles(usernames: Array<string>): Promise<Array<UserProfile>> {
        return await this.callFunc('get_user_profile', usernames);
    }

    async getAllUsers(): Promise<Array<User>> {
        return await this.callFunc('filter_users', { filter: '' });
    }

    async searchUsers(query: string): Promise<Array<User>> {
        return await this.callFunc('filter_users', { filter: query });
    }
}