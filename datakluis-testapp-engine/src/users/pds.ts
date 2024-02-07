import {httputil, util } from "@datavillage-me/api";
import {
    Recommendation,
    PersonalProfile,
    PROFILE_PATH, initPodFolder, RECOMMANDATIONS_PATH,
} from "@datavillage-me/cage-template-core";
import nodefetch from "node-fetch";

export type User = { uri: string, podUri: string };

/**
 * Abstract interface to the registry of users
 */
export interface UsersRegistry {
    registerUser(user: User): Promise<any>;

    getUsers(): Promise<string[]>;

    getUserAppStorage(userId: string, fetchFn?: typeof fetch): Promise<UsersStorage>;
}

/**
 * Abstract interface to the personal data store of a user
 */
export interface UsersStorage {
    resetStorage(): Promise<void> ;

    getUserProfile(): Promise<PersonalProfile | undefined> ;

    saveRecommandations(recommandations: Recommendation[]): Promise<void>;
}

/**
 * Implementation of UsersStorage over plain HTTP, possibly with a pre-authenticated fetch function
 */
export class HttpUserStorage implements UsersStorage {

    private userUri: string;
    private fetchFn: typeof fetch;
    private appFolderUri: string;

    // @ts-ignore  // there's a type discrepancy between node-fetch fetch signature and the plain DOM
    constructor(userUri: string, appFolderUri: string, fetchFn: typeof fetch = nodefetch) {
        util.assert(appFolderUri.endsWith('/'), "App folder must end with a slash : "+appFolderUri);

        this.userUri = userUri;
        this.appFolderUri = appFolderUri;
        this.fetchFn = fetchFn;
    }

    async getUserProfile(): Promise<PersonalProfile | undefined> {
        const profile = await this.fetchFn(this.appFolderUri+PROFILE_PATH)
            .then(httputil.handleHttpPromiseStatus)
            .then(resp => resp.json()).then(profile => ({...profile, uri: this.userUri} as PersonalProfile)).catch(httputil._404_undefined);
        return profile;
    }

    async saveRecommandations(recommandations: Recommendation[]): Promise<void> {
        await this.fetchFn(this.appFolderUri+RECOMMANDATIONS_PATH, {method: 'PUT', body: JSON.stringify(recommandations, undefined, 4)})
            .then(httputil.handleHttpPromiseStatus)
            .then(resp => resp.json());
    }

    async resetStorage() {
        await initPodFolder(this.appFolderUri, this.fetchFn);
    }
}