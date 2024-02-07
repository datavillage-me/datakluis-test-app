import {useMemo} from "react";
import {PersonalProfile, PROFILE_PATH, RECOMMANDATIONS_PATH, Recommendation} from "@datavillage-me/cage-template-core";
import {CachedPromiseState, usePromiseFn} from "@datavillage-me/dv-common-ui";
import {httputil} from "@datavillage-me/api";
import {DvTemplateAuth} from "../auth";

export type WritablePromiseState<T> = CachedPromiseState<T> & { update: (value: T) => Promise<void> }

export function useProfile(podUrl?: string, fetchFn?: typeof fetch): WritablePromiseState<PersonalProfile | undefined> {
    const profile$ = usePromiseFn(
        async () => podUrl ?
            await (fetchFn || fetch)(podUrl + PROFILE_PATH).then(httputil.handleHttpPromiseStatus).then(resp => resp.json() as Promise<PersonalProfile>).catch(httputil._404_undefined) :
            undefined,
        [fetchFn, podUrl]);

    // WARN this is a hack - the 'update' method should be incoporated in the usePromiseFn  logic
    (profile$ as WritablePromiseState<PersonalProfile | undefined>).update = async (value) => {
        await (fetchFn || fetch)(podUrl + PROFILE_PATH, {
            body: JSON.stringify(value, undefined, 4),
            method: 'PUT',
            headers: {'Content-Type': 'application/json'}
        }).then(httputil.handleHttpPromiseStatus);
        profile$.fetch();
        return;
    };

    return profile$ as WritablePromiseState<PersonalProfile | undefined>;
}

export function useRecommandations(podUrl?: string, fetchFn?: typeof fetch) {
    const recommandations$ = usePromiseFn(
        async () => podUrl ?
            await (fetchFn || fetch)(podUrl + RECOMMANDATIONS_PATH).then(httputil.handleHttpPromiseStatus).then(resp => resp.json() as Promise<Recommendation[]>).catch(httputil._404_undefined) :
            undefined,
        [fetchFn, podUrl]);

    return recommandations$;
}

export function useStorage(fetchFn?: typeof fetch) {

    const session = DvTemplateAuth.useSession();
    const f = fetchFn || session.fetch;
    const storage = useMemo(() => ({
        useProfile: () => useProfile(session.podUrl, f),
        useRecommandations: () => useRecommandations(session.podUrl, f)
    }), [f, session.podUrl])

    return storage;
}