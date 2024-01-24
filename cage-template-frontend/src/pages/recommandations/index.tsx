import * as React from "react";
import {TextField} from "@mui/material";
import {useCallback, useState} from "react";
import {Switch as MuiSwitch} from '@mui/material';
import {DvTemplateAuth} from "../../auth";
import {useBackend} from "../../utils/engine";
import { Recommendation } from "@datavillage-me/cage-template-core";

export const SearchAndRec = () => {

    return (
        <div>
            <h2>Recherche</h2>
            <SearchDatasets/>
        </div>
    );
}

export const SearchDatasets = () => {

    const session = DvTemplateAuth.useSession();
    const backend = useBackend();

    const [useProfile, setUseProfile] = useState(false);

    const [recos, setRecos] = useState<Recommendation[]>([]);

    const search = useCallback(async (searchText: string | undefined | null) => {
        const recos = searchText ?
            await backend.search(searchText, useProfile ? session.userId : undefined) :
            [];
        setRecos(recos);
    }, [useProfile]);

    return (
        <div>
            <div>
                <TextField id="outlined-basic" label="Search terms" variant="outlined" onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        search((e.target as HTMLInputElement).value)
                    }
                }}/>
                <MuiSwitch checked={useProfile} onChange={(event, checked) => setUseProfile(checked)}/> Use Profile
            </div>
            <div>
                {recos.map(reco => <div>{reco.title || reco.objectUri}</div>)}
            </div>
        </div>
    );
}




