import {getResourceInfo} from "@inrupt/solid-client";
import {httputil} from "@datavillage-me/api";
import {
    PersonalProfile
} from "../model";
import {user_sdo_001} from "../model/samples/profile";

// where to store the user profile in the app path
export const PROFILE_PATH = "profile.json";

// where to store recommendations in the app path
export const RECOMMANDATIONS_PATH = "recommandations.json";

// the object model of what is stored in the pod
// it excludes the uri, as the uri is the web id, and is inferred from the owner of the pod
export type PodPersonalProfile = Omit<PersonalProfile, 'uri'>;

export const createEmptyProfile = (): PodPersonalProfile => ({
    favourites: [],
    history: [],
    interests: []
})

export async function initPodFolder(folderUrl: string, fetchFn: typeof fetch = fetch) {

    const folder = await getResourceInfo(folderUrl, {fetch: fetchFn}).catch(err => {
        if (err.response.status == 404) return undefined;
        else throw err;
    });

    if (!folder) {
        await fetchFn(folderUrl + "README.md", {body: "# DV Template folder", method: 'PUT'});
    }

    await initProfile(folderUrl + PROFILE_PATH,fetchFn);

    /*  TODO should there be some specific rights set on folder at init ?
    await grantPublicAccess(
        folderUrl,
        fetchFn
    )
     */
}

export async function initProfile(profileUrl: string, fetchFn: typeof fetch = fetch, reset?:boolean, useSampleData?: boolean) {

    const profile = await fetchFn(profileUrl).then(httputil.handleHttpPromiseStatus).then(resp => resp.json()).catch(httputil._404_undefined).catch(err => {
        console.warn("Failed to parse profile : "+err);
        if (reset)
            return undefined;
        else throw err;
    });

    if (!profile || reset) {
        const newProfile = useSampleData ? {...user_sdo_001, uri: undefined} : createEmptyProfile();
        await fetchFn(profileUrl, {body: JSON.stringify(newProfile, undefined, 4), method: 'PUT'});
    }
}