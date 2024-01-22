import {DvTemplateAuth} from "../auth";
import { util } from "@datavillage-me/api";
import {Recommendation} from "dvtemplate-core";
import {useMemo} from "react";

export function getBackendUrl(apiUrl: string | undefined, path: string, params?: Record<string, any>) {
    const url = new URL(path, util.sanitizePath(apiUrl || window.location.href, 'SLASH'));

    params && Object.entries( params).forEach( ([key, value]) => {
        if (value != undefined) url.searchParams.append(key, value);
    })

    //url.searchParams;

    return url.toString();
};

export function useBackend() {
    const {engineApiUrl} = DvTemplateAuth.useSession();

    return useMemo( () => {
        return {
            getUsers: async () => {
                const url = getBackendUrl(engineApiUrl, "admin/users");
                const resp = await fetch(url);
                return await resp.json() as string[]
            },

            search: async (searchText: string, userId?: string) => {
                const resp = await fetch(getBackendUrl(engineApiUrl, "recommandations", {userId}));
                const recos = (await resp.json()) as Recommendation[];

                return recos;
            }
        }
    }, [engineApiUrl])


}