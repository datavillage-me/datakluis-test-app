import * as React from "react";
import {lazy, Suspense, useCallback, useEffect, useState} from "react";
import {Button, Switch} from "@mui/material";
import {useStorage} from "../../utils/storage";
import {PromiseStateContainer} from "@datavillage-me/dv-common-ui";
import {httputil} from "@datavillage-me/api";
import {ErrorBoundary} from "../../utils/ui-utils";
import {initProfile, PROFILE_PATH} from "@datavillage-me/cage-template-core";

export function Profile(props: { podUrl: string, fetch: typeof fetch }) {
    const [useRaw, setUseRaw] = useState(false);

    return <div>
        <h1>Profile <Switch value={useRaw} onChange={(e) => setUseRaw(e.currentTarget.checked)}
                            aria-label={"Raw Edit"}/></h1>
        {useRaw ? <RawResourceEditor resourceUrl={props.podUrl + PROFILE_PATH} fetch={props.fetch}
                                     reset={() => initProfile(props.podUrl + PROFILE_PATH, props.fetch, true, true)}/> :
            <div><ProfileEditor/></div>}
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


export const RawResourceEditor = (props: { resourceUrl: string, fetch: typeof fetch, reset?: () => void }) => {

    const [profileStr, setProfileStr] = useState<string>();
    const [editedStr, setEditedStr] = useState<string>();

    useEffect(() => {
        props.fetch(props.resourceUrl).then(httputil.handleHttpPromiseStatus).then(resp => resp.text()).catch(httputil._404_undefined).then(text => {
            setProfileStr(text);
            setEditedStr(text)
        })
    }, [props.fetch, props.resourceUrl]);

    const saveProfile = useCallback((str) => {
        return props.fetch(props.resourceUrl, {method: 'PUT', body: str});
    }, [props.fetch, props.resourceUrl]);

    const MonacoEditor = lazy(() => import('../../utils/monaco').then(module => ({default: module.MonacoEditor})));

    return <div>
        Displaying resource at {props.resourceUrl}<br/>
        <Button variant="contained" disabled={profileStr == editedStr} color="secondary"
                onClick={() => saveProfile(editedStr).then(() => {
                    setProfileStr(editedStr)
                })}>Save</Button>
        {props.reset ? <Button variant="contained" color="primary" onClick={props.reset}>Reset</Button> : null}
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorBoundary>
                <MonacoEditor text={profileStr || ''} language="json" onChange={setEditedStr}/>
            </ErrorBoundary>
        </Suspense>
    </div>
};