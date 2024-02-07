import {useState} from "react";
import {Switch} from "@mui/material";
import {RECOMMANDATIONS_PATH} from "@datavillage-me/cage-template-core";
import * as React from "react";
import {RawResourceEditor} from "./profile";
import {useStorage} from "../../utils/storage";
import {PromiseStateContainer} from "@datavillage-me/dv-common-ui";

export function Recommandations(props: { podUrl: string, fetch: typeof fetch }) {
    const [useRaw, setUseRaw] = useState(false);

    return <div>
        <h1>Recommandations <Switch value={useRaw} onChange={(e) => setUseRaw(e.currentTarget.checked)}
                            aria-label={"Raw Edit"}/></h1>
        {useRaw ? <RawResourceEditor resourceUrl={props.podUrl + RECOMMANDATIONS_PATH} fetch={props.fetch} /> :
            <div><RecommandationsView/></div>}
    </div>
}

export const RecommandationsView = () => {

    const storage = useStorage();
    const recos$ = storage.useRecommandations()

    return <div>
        <PromiseStateContainer promiseState={recos$}>
            {(recos) => recos ? <div>
                { recos.map(r => <div>{r.timestamp} - {r.score} - {r.title}</div>) }
            </div> : null}
        </PromiseStateContainer>
    </div>
}