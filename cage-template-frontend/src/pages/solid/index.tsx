import * as React from "react";
import {Box, Tab, Tabs} from "@mui/material";
import {usePromiseFn} from "../../utils/hooks";
import { PromiseStateContainer} from "../../utils/ui-utils";
import {Profile} from "./profile";
import {DvTemplateAuth} from "../../auth";
import {util} from '@datavillage-me/api';
import {Recommandations} from "./recommandations";

function TabPanel(props: {
    children?: React.ReactNode;
    index: number;
    value: number;
}) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}


export const SolidDashboard = () => {

    const session = DvTemplateAuth.useSession();

    util.assert(session.podUrl);

    //const idDoc = usePromiseFn(async () => session.info.webId ? session.fetch(session.info.webId, {headers: {'Accept': 'text/turtle'}}) : undefined, [session.fetch, session.info.webId]);

    const [value, setValue] = React.useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return <div>
        {! session.app?.isRegistered ?
            <DvTemplateAuth.SubscribeButton />
 : /*
            !session.accessGranted ? // This should be done already, but in case the pod is in broken state
                    <button onClick={() => initSpwFolder(session.podUrl!, {name: "New User"}, session.fetch)}>
                        Autoriser l'utilisation du pod pour la génération de recommandations
                    </button>: */
                <>
                    <Box style={{margin: '0px -10px', marginBottom: '15px'}}>
                        <Tabs value={value} TabIndicatorProps={{style: {backgroundColor: 'black'}}}
                              onChange={handleTabChange}
                              aria-label="basic tabs example">
                            <Tab label="Profile" {...a11yProps(0)} />
                            <Tab label="Recommandations" {...a11yProps(1)} />
                            <Tab label="Tests" {...a11yProps(2)} />
                        </Tabs>
                    </Box>

                    <TabPanel value={value} index={0}>
                        <Profile podUrl={session.podUrl} fetch={session.fetch}/>
                    </TabPanel>

                    <TabPanel value={value} index={1}>
                        <Recommandations podUrl={session.podUrl} fetch={session.fetch}/>
                    </TabPanel>
                </>}

    </div>

};


export const FileContent = (props: { url: string, fetch: typeof fetch }) => {

    const doc$ = usePromiseFn(async () => props.fetch(props.url).then(resp => resp.text()), [props.fetch, props.url]);

    return <div>
        {doc$.done ? 'Displaying' : 'Fetching'} resource at {props.url}
        <PromiseStateContainer state={doc$}>
            {(doc) => <pre>
                {doc}
            </pre>}
        </PromiseStateContainer></div>


};
