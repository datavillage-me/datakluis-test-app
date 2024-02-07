import * as React from "react";
import {useBackend} from "../../utils/engine";
import {PromiseStateContainer, usePromiseFn} from "@datavillage-me/dv-common-ui";
import Button from "@mui/material/Button";
import {useCallback} from "react";
import {useRemoteClient, useSession} from "../../auth";
import {EVENT_TYPES_NAMES} from "@datavillage-me/cage-template-core/dist/esm/events";

/**
 * This panel contains admin actions and should be accessible only to app admins
 * @constructor
 */
export const AdminPanel = () => {

    const backend = useBackend();
    const client = useRemoteClient();
    const dvSession = useSession();

    const users$ = usePromiseFn( async () => backend.getUsers(), [backend]);

    const sendEvent = useCallback((eventType: string, payload: Record<string, any> = {}) => {
        if (client && dvSession.settings?.DV_APP_ID) {
            client.getCollaborationSpacesServices().getCageServices(dvSession.settings?.DV_APP_ID).postEvent({type: eventType, ...payload});
        }
    }, [client, dvSession.settings?.DV_APP_ID]);

    return (
        <div>
            <h2>Recommandation Engine Admin Panel</h2>

            <Button onClick={() => sendEvent('PING')}>Send PING event</Button>
            <Button onClick={() => sendEvent(EVENT_TYPES_NAMES.PROCESS_USERS)}>Send 'process users' event</Button>

            <PromiseStateContainer promiseState={users$}>
                {(users) =>
                    <div>
                        Users : {users.length}<br/>
                    </div>
                }
            </PromiseStateContainer>

        </div>
    );
}