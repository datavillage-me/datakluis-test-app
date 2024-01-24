import * as React from "react";
import {useBackend} from "../../utils/engine";
import {PromiseStateContainer, usePromiseFn} from "@datavillage-me/dv-common-ui";

/**
 * This panel contains admin actions and should be accessible only to app admins
 * @constructor
 */
export const AdminPanel = () => {

    const backend = useBackend();

    const users$ = usePromiseFn( async () => backend.getUsers(), [backend]);

    return (
        <div>
            <h2>Recommandation Engine Admin Panel</h2>

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