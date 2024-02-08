import {UsersRegistry} from "../users/pds";
import {Recommendation} from "@datavillage-me/cage-template-core";
import { sendEmail } from "./email";

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

            return [
                {title: 'Fake Recommandation 1', objectUri: 'https://acme.com/objects/001', score: 0.6, timestamp: new Date().toISOString()},
                {title: 'Fake Recommandation 2', objectUri: 'https://acme.com/objects/002', score: 0.2, timestamp: new Date().toISOString()}
            ];
        } else {
            throw new Error("User does not exist");
        }
    }

    storeRecommandations(userId: string, recommendations: Recommendation[]) {
        return this.userReg.getUserAppStorage(userId).then(store => store.saveRecommandations(recommendations));
    }

    async createAndStoreRecommandationsForUsers(userIds?: string[], email?: boolean) {

        userIds = userIds || await this.getUsers();

        console.info(`Batch processing recommendations for ${userIds.length} users`);

        // using a for loop to serialize await calls
        for (let idx in userIds) {
            const userId = userIds[idx];
            try {
                const storage = await this.userReg.getUserAppStorage(userId);
                const profile = await storage.getUserProfile();

                const recos = await this.getRecommandations(userId);
                await this.storeRecommandations(userId, recos);

                if (email && profile?.notificationEmail) sendEmail(profile.notificationEmail)
            } catch (err) {
                console.warn(`Failed to produce or store recommendations for user ${userId} : ${err}`);
            }
        }

        // TODO
        // return job summary with success states ?
    }

}