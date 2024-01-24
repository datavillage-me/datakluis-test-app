import {UsersRegistry} from "../users/pds";
import {Recommendation} from "@datavillage-me/cage-template-core";
import { util } from "@datavillage-me/api";


export class RecommandationEngine {

    private userReg: UsersRegistry;


    constructor(userReg: UsersRegistry) {
        this.userReg = userReg;
    }

    async getRecommandations(userId?: string, searchTerms?: string[], reloadProfile?: boolean): Promise<Recommendation[]> {

        util.assert(userId, "No user provided");

        const userProfile = await this.userReg.getUserAppStorage(userId).then(store => store.getUserProfile());

        if (userProfile) {
            // TODO produce recommendations

            return [];
        } else {
            throw new Error("User does not exist");
        }
    }

}