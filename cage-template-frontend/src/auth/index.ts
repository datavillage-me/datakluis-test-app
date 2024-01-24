import React, {ReactElement, ReactNode} from "react";
import {DatavillageAuth} from "./datavillage";

export * from './solid';
export * from './datavillage';

export type Session = {
    engineApiUrl?: string,
    userId?: string,
    displayName?: string,
    isLoggedIn: boolean,
    podUrl?: string,
    fetch: typeof fetch,
    app? : (
        {
            isRegistered: false
        } |
        {
        isRegistered: true,
        appFolder?: string,
    })
}

/**
 * The set of generic react components required to handle authentication and subscription
 */
export type AuthModule = {
    /**
     * A react hook to obtain the current session
     */
    useSession: () => Session,

    /**
     * a button that triggers the subscribe flow, where the user can consent to the app
     */
    SubscribeButton: React.FC<{ children?: React.ReactElement; }>,

    /**
     * a button that triggers the login flow
     */
    LoginButton: React.FC<{ children?: React.ReactElement; }>,

    /**
     * a button that logs out the user
     */
    LogoutButton: React.FC<{ children?: React.ReactElement; }>,

    /**
     * a React Context Provider that handles the context object containing the session
     */
    SessionProvider: (props: { children: ReactNode | ((props: {session: Session}) => JSX.Element) }) => ReactElement
}

// this global variable points to the AuthModule in use ; by default the Datavillage  one
export const DvTemplateAuth: AuthModule = DatavillageAuth;