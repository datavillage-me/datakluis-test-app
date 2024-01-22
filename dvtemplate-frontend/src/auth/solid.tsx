import {LoginButton, LogoutButton, SessionProvider, useSession as inruptUseSession} from '@inrupt/solid-ui-react';
import {AuthModule, Session} from "./index";
import {useEffect, useState} from "react";
import {Button, MenuItem, Select} from "@mui/material";
import * as React from "react";
import {getBackendUrl} from "../utils/engine";
import {getPodUrls} from "dvtemplate-core";
import {httputil} from '@datavillage-me/api';


/**
 * This module is an alternative implementation of the AuthModule
 * based on a direct connection to the solid pods.
 * It is not meant to be fully functional nor productizable.
 */


const ISSUERS = {
    //"https://openid.sandbox-pod.datanutsbedrijf.be": "DNB Sandbox",
    "https://inrupt.net": "Inrupt.net",
    "https://solidcommunity.net/": "Solid Community",
    "https://login.inrupt.com/": "Inrupt Pod Spaces",
    "https://idp.use.id/": "use.id",
    "http://localhost:3000/": "Localhost Solid"
}

const LoginMultiButton = (props: { children?: React.ReactElement; }) => {
    const [issuer, setIssuer] = useState("https://login.inrupt.com/");

    return (
        <LoginButton
            authOptions={
                {
                    clientName: "My Test App",
                }
            }
            oidcIssuer={issuer}
            // this is the ID issuer for the DNB sandbox
            redirectUrl={window.location.href.split('#')[0] /* new URL("/", window.location.href ).toString()*/}
            onError={console.log}
        >
            {props.children || <Button variant="contained" color="primary">
                Log in with&nbsp;
                <Select
                    value={issuer}
                    onChange={(e) => {
                        setIssuer(e.target.value as string);
                        e.stopPropagation()
                    }}
                >
                    {Object.keys(ISSUERS).map(uri => <MenuItem value={uri} key={uri}>{ISSUERS[uri]}</MenuItem>)}
                </Select>
            </Button>}
        </LoginButton>
    );
};


const useSession = () => {
    const solidSession = inruptUseSession();

    const [session, setSession] = useState<Session>({isLoggedIn: false, fetch});

    useEffect(() => {
        if (solidSession.session.info.isLoggedIn && solidSession.session.info.webId) {
            getPodUrls(solidSession.session.info.webId, {fetch: solidSession.fetch}).then(urls => urls[0])
                .then(async (podUrl) => {
                    // leave this undefined, meaning the backend is supposed to be sitting at the same URL as this app
                    const engineApiUrl = undefined;

                    //const access = await getPublicAccess(podUrl + SPW_PATH, solidSession.fetch).catch(err => undefined) || undefined;
                    //const idDoc = await solidSession.fetch(solidSession.session.info.webId!, {headers: {'Accept': 'text/turtle'}}).then(resp => resp.text());
                    const registeredUser = await fetch(getBackendUrl(engineApiUrl, "user", {userUri: solidSession.session.info.webId}).toString()).then(httputil.handleHttpPromiseStatus).then(resp => resp.json()).catch(httputil._404_undefined);

                    setSession({
                        engineApiUrl: engineApiUrl,
                        isLoggedIn: solidSession.session.info.isLoggedIn,
                        userId: solidSession.session.info.webId,
                        app: registeredUser ? {isRegistered: true, appFolder: 'spw/'} : undefined,
                        fetch: solidSession.fetch,
                        // session: solidSession,
                        //accessGranted: access?.read && access?.write,
                    })
                })
        }
    }, [solidSession.session.info, solidSession.fetch])


    return session;
}


const SubscribeButton = () => {

    const session = useSession();
    //const backend = useBackend();

    return (
        session.userId ?
            <Button variant="contained" color="primary"
                    onClick={() => undefined /* TODO backend.registerUser(session.userId!, session.podUrl!) */}>
                Subscribe to Template project
            </Button> : <>Not authenticated</>
    );
};

export const SolidAuth: AuthModule = {
    useSession, LoginButton: LoginMultiButton, LogoutButton, SessionProvider, SubscribeButton

}