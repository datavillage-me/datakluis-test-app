import * as React from "react";
import {lazy, Suspense, useCallback, useEffect, useState} from "react";
import {Button, Switch} from "@mui/material";
import {useStorage} from "../../utils/storage";
import { PromiseStateContainer } from "@datavillage-me/dv-common-ui";
import { httputil } from "@datavillage-me/api";
import { ErrorBoundary } from "../../utils/ui-utils";
import {initProfile, PROFILE_PATH} from "@datavillage-me/cage-template-core";

export function Profile(props: { podUrl: string, fetch: typeof fetch }) {
    const [useRaw, setUseRaw] = useState(false);

    return <div>
        <h1>Profile <Switch value={useRaw} onChange={(e) => setUseRaw(e.currentTarget.checked)} aria-label={"Raw Edit"}/></h1>
        {useRaw ? <RawProfileEditor profileUrl={props.podUrl + PROFILE_PATH} fetch={props.fetch}/> : <div> <ProfileEditor /> </div>}
    </div>
}

export const ProfileEditor = () => {

    const storage = useStorage();
    const profile$ = storage.useProfile();

    return <div>
        <PromiseStateContainer promiseState={profile$!}>
            {(profile) => profile ? <div>
                <h2>History</h2>
                { /* TODO profile.viewHistory.map(i => <div>{i.uri}</div>) */}
            </div> : null}
        </PromiseStateContainer>
    </div>
}


export const RawProfileEditor = (props: { profileUrl: string, fetch: typeof fetch }) => {

    const [profileStr, setProfileStr] = useState<string>();
    const [editedStr, setEditedStr] = useState<string>();

    useEffect(() => {
        props.fetch(props.profileUrl).then(httputil.handleHttpPromiseStatus).then(resp => resp.text()).catch(httputil._404_undefined).then(text => {setProfileStr(text); setEditedStr(text)})
    }, [props.fetch, props.profileUrl]);

    const saveProfile = useCallback((str) => {
        return props.fetch(props.profileUrl, {method: 'PUT', body: str});
    }, [props.fetch, props.profileUrl]);

    const MonacoEditor = lazy(() => import('../../utils/monaco').then(module => ({default: module.MonacoEditor})));

    return <div>
        Displaying profile at {props.profileUrl}<br/>
        <Button variant="contained" disabled={profileStr == editedStr} color="secondary" onClick={() => saveProfile(editedStr).then(() => {setProfileStr(editedStr)})}>Save</Button>
        <Button variant="contained" color="primary" onClick={() => initProfile(props.profileUrl, props.fetch, true, true)}>Reset</Button>
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorBoundary>
                <MonacoEditor text={profileStr || ''} language="json" onChange={setEditedStr}/>
            </ErrorBoundary>
        </Suspense>
    </div>
};