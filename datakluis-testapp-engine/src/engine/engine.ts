import {UsersRegistry} from "../users/pds";
import {Recommendation} from "@datavillage-me/cage-template-core";

export class RecommandationEngine {

    private userReg: UsersRegistry;


    constructor(userReg: UsersRegistry) {
        this.userReg = userReg;
    }

    getUsers() {
        return this.userReg.getUsers();
    }

    async getRecommandations(userId: string): Promise<Recommendation[]> {

        const userProfile = await this.userReg.getUserAppStorage(userId).then(store => store.getUserProfile());

        if (userProfile) {
            // TODO produce recommendations

            return [];
        } else {
            throw new Error("User does not exist");
        }
    }

    storeRecommandations(userId: string, recommendations: Recommendation[]) {
        return this.userReg.getUserAppStorage(userId).then(store => store.saveRecommandations(recommendations));
    }

    async createAndStoreRecommandationsForUsers(userIds?: string[]) {

        userIds = userIds || await this.getUsers();

        console.info(`Batch processing recommendations for ${userIds.length} users`);

        // using a for loop to serialize await calls
        for (let idx in userIds) {
            const userId = userIds[idx];
            try {
                const recos = await this.getRecommandations(userId);
                await this.storeRecommandations(userId, recos);
            } catch (err) {
                console.warn(`Failed to produce or store recommendations for user ${userId} : ${err}`);
            }
        }

        // TODO
        // return job summary with success states ?
    }

}