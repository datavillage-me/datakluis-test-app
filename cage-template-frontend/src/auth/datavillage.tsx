import * as React from 'react';
import {createContext, useContext, useEffect, useMemo, useState} from 'react';

import {
    Client,
    getRemoteClient,
    httputil,
    POD_IDENTITY_PROVIDER,
    UserDetails,
    UserScopeApplicationWithUserData,
    util
} from "@datavillage-me/api";
import {AuthModule, Session} from "./index";
import {Button, MenuItem, Select} from "@mui/material";

/**
 * The set of settings provided by the Datavillage platform host
 */
export type EngineAppSettings = {
    DV_APP_ID: string,
    DV_CLIENT_ID: string,
    ENGINE_API_URL?: string,
    DV_SETTINGS: {
        apiUrl: string,
        loginUrl: string,
        passportUrl: string,
        consoleUrl: string,
    }
}

/**
 * The Datavillage Session Context contains some extra fields wrt the regular Session
 */
export type DatavillageSessionContextType = Session & {
    settings?: EngineAppSettings,
    currentUser?: UserDetails,
    appMetadata?: UserScopeApplicationWithUserData,
    passportUrl?: string,
    updateContext: (update: Partial<DatavillageSessionContextType>) => void
};

export const DatavillageSessionContext = createContext<DatavillageSessionContextType>({
    isLoggedIn: false,
    fetch,
    updateContext: () => undefined
});

function DatavillageSessionProvider(props: {
    children: React.ReactNode | ((props: { session: DatavillageSessionContextType }) => JSX.Element)
}) {
    // store the current context as a state variable
    const [context, setContext] = useState<DatavillageSessionContextType>({
        isLoggedIn: false,
        fetch,
        updateContext: (update) => setContext((prevContext) => ({...prevContext, ...update}))
    });

    // fetch the settings exposed by the engine backend
    // should be done only once
    useEffect(() => {
        fetch("./settings.json").catch(httputil._404_undefined).then(str => str ? str.json() as unknown as EngineAppSettings : undefined).then(settings => context.updateContext({
            settings
        }));
    }, []);

    // fetch various other resources to initialize the session context
    useEffect(() => {
        if (context.settings?.DV_SETTINGS.apiUrl) {
            const apiUrl = context.settings.DV_SETTINGS.apiUrl;
            const client = getBrowserRemoteClient(apiUrl);

            // get the currently logged in user
            client.getPassport().getCurrentUser()
                .then(currentUser => {
                    // create an authenticated HTTP client to the Datavillage API
                    // that client will be authenticated as the current user
                    const authenticatedClient = new httputil.HttpClient(apiUrl, undefined, 'BrowserCredentials');

                    context.updateContext({
                        currentUser,
                        // let the podUrl point to the DV API proxy to the user pod ( ./collaborationSpaces/[appId]/users/[userId]/appdata/ )
                        podUrl: currentUser && (util.sanitizePath(apiUrl, 'SLASH') + `collaborationSpaces/${context.settings?.DV_APP_ID}/users/${currentUser.id}/appdata/`),

                        // the fetch function delegates to the authorizedFetch from the client
                        fetch: (input, init) => {
                            if (typeof input != 'string') {
                                throw new Error('fetch on non-string URL not supported');
                            }
                            return authenticatedClient.authorizedFetch(input, init, true)
                        },
                        userId: currentUser?.id,
                        displayName: currentUser && (currentUser.identities[0].displayName || currentUser.identities[0].name || currentUser.identities[0].userName || currentUser.identities[0].id),
                        isLoggedIn: !!currentUser?.id,
                        engineApiUrl: context.settings?.ENGINE_API_URL
                    })
                }).catch(err => {
                console.warn(`Auth failed: ${err}`);
                setContext({...context, currentUser: undefined})
            })
        }

    }, [context.settings]);


    // get the current registration status of this user wrt to the app
    // this is done by browsing all user's registered active apps and find the matching one
    useEffect(() => {
        if (context.settings && context.currentUser) {
            const settings = context.settings;
            const client = getBrowserRemoteClient(settings.DV_SETTINGS.apiUrl);

            // TODO have an endpoint that fetches directly one single app metadata
            client.getCollaborationSpacesServices().getAllForUser(context.currentUser.id).then(apps => {
                const appMetadata = apps.find(app => app.id == settings.DV_APP_ID);
                util.assert(appMetadata, `User ${context.currentUser?.id} not registered for app ${settings.DV_APP_ID}`);

                context.updateContext({
                    appMetadata: appMetadata,
                    app: {
                        isRegistered: !!appMetadata.userData?.activeConsentId,
                        appFolder: appMetadata.appSettings.podFolder
                    },
                    //  TODO get passport URL from DV app metadata
                    passportUrl:  /* appMetadata.passportUrl || */ settings.DV_SETTINGS.passportUrl
                });
            })
        } else {
            context.updateContext({app: {isRegistered: false}})
        }
    }, [context.settings, context.currentUser?.id]);


    return <DatavillageSessionContext.Provider
        value={context}> {typeof props.children == 'function' ? props.children({session: context}) : props.children} </DatavillageSessionContext.Provider>;
}


function getBrowserRemoteClient(url: string) {
    return getRemoteClient(url, undefined, 'BrowserCredentials');
}

/**
 * React hook that returns a remote client based on the config in the current or provided AppContext
 * @param ctx
 */
export const useRemoteClient = (ctx?: DatavillageSessionContextType) => {
    const sessionContext = useContext(DatavillageSessionContext);
    const validCtx = ctx || sessionContext;

    const client = useMemo(() => {
        return validCtx.settings?.DV_SETTINGS.apiUrl ? getBrowserRemoteClient(validCtx.settings?.DV_SETTINGS.apiUrl) : undefined;
    }, [validCtx.settings?.DV_SETTINGS.apiUrl]);

    return client;
};

/**
 * React hook that returns the authenticated session, if any
 */
export const useSession = function (): DatavillageSessionContextType {
    const sessionContext = useContext(DatavillageSessionContext);

    return sessionContext;
}

export function inIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

async function handleProviderAuth(
    client: Client,
    redirectUrl: string,
    podType: POD_IDENTITY_PROVIDER,
    issuer?: string
) {
    try {
        if (!redirectUrl) {
            // if no redirectUrl is provided, redirect to the app root
            const currentUrl = new URL(window.location.href);
            currentUrl.hash = '';
            redirectUrl = currentUrl.toString();
        }

        // TODO use separate login window always, or only when embedded in iFrame ?
        if (inIframe()) {
            // postMessage listening function
            const listener = (e: MessageEvent) => {
                if (e.origin != window.location.origin) {
                    console.warn(`Received a login callback from wrong origin (${e.origin}) ; ignoring `);
                } else {
                    try {
                        if (e.data == 'OK') {
                            // the login has succeeded - let's redirect to the original redirectUrl ...
                            window.location.href = redirectUrl;
                        } else {
                            // TODO process error status
                            console.warn('Unknown login flow event : ' + e.data);
                        }
                    } finally {
                        // remove the postMessage listener
                        window.removeEventListener('message', listener, false);
                        loginWindow && loginWindow.close();
                    }
                }
            };

            // use /login/callback as redirectUrl. That will result in a postMessage upon login
            // the actual redirectUrl will then be used in the listener above
            const authUrl = await client
                .getPassport()
                .getAuthenticationUrl(window.location.origin + '/login/callback', podType, issuer);

            window.addEventListener('message', listener, false);
            const loginWindow = window.open(authUrl);
        } else {
            // Build the external auth URL that will target the Passport Auth component
            // The successful login flow will eventually result in a redirect from Passport to the redirectUrl
            const authUrl = await client.getPassport().getAuthenticationUrl(redirectUrl, podType, issuer);

            window.location.href = authUrl;
        }
    } catch (error) {
        throw new util.WrappedError("Failed to start authentication flow", error)
    }
}


const AUTH_PROVIDERS: { label: string, type: POD_IDENTITY_PROVIDER, issuer?: string }[] = [
    {label: 'Google Drive', type: POD_IDENTITY_PROVIDER.Google, issuer: 'https://drive.google.com'},
    {label: 'Inrupt.net', type: POD_IDENTITY_PROVIDER.Solid, issuer: 'https://inrupt.net'},
    {label: 'Solid Community', type: POD_IDENTITY_PROVIDER.Solid, issuer: 'https://solidcommunity.net/'},
    {label: 'Inrupt Pod Spaces', type: POD_IDENTITY_PROVIDER.Solid, issuer: 'https://login.inrupt.com/'},
    //{label: 'use.id', type: POD_IDENTITY_PROVIDER.Solid, issuer: 'https://idp.use.id/'},
    {label: 'DNB Sandbox', type: POD_IDENTITY_PROVIDER.Solid, issuer: 'https://openid.sandbox-pod.datanutsbedrijf.be'},
]

const LoginButton = () => {

    const client = useRemoteClient();

    const [provider, setProvider] = useState<typeof AUTH_PROVIDERS[0]>(AUTH_PROVIDERS[0]);

    return (
        <Button variant="contained" color="primary"
                onClick={() => client && handleProviderAuth(client, '', provider.type, provider.issuer)}>
            Log in with&nbsp;
            <Select
                value={provider.issuer}
                onChange={(e) => {
                    setProvider(AUTH_PROVIDERS.find(p => p.issuer == e.target.value) || AUTH_PROVIDERS[0]);
                    e.stopPropagation()
                }}
            >
                {AUTH_PROVIDERS.map(prov => <MenuItem value={prov.issuer} key={prov.issuer} onClick={(e) => {
                    e.stopPropagation()
                }}>{prov.label}</MenuItem>)}
            </Select>
        </Button>

    );
};


const LogoutButton = () => {

    const client = useRemoteClient();
    const sessionContext = useContext(DatavillageSessionContext);

    return (
        client ?
            <Button variant="contained" color="primary"
                    onClick={() => client?.getPassport().logout().then(() => sessionContext.updateContext({
                        currentUser: undefined,
                        podUrl: undefined,
                        userId: undefined,
                        isLoggedIn: false,
                    }))}>
                Logout
            </Button> : <>Not authenticated</>
    );
};


const SubscribeButton = () => {
    const sessionContext = useContext(DatavillageSessionContext);

    return (
        <Button variant="contained" color="primary"
                onClick={() => window.location.href = `${sessionContext.passportUrl}/?clientId=${sessionContext.settings?.DV_CLIENT_ID}&applicationId=${sessionContext.settings?.DV_APP_ID}`}>
            Subscribe to the service
        </Button>
    );
};


export const DatavillageAuth: AuthModule = {
    useSession, LoginButton, LogoutButton, SessionProvider: DatavillageSessionProvider, SubscribeButton
}