import express, {Application} from 'express';
import {RecommandationRouter} from "./recoRouter";
import {RecommandationEngine} from "../engine/engine";
import {AdminRouter} from "./adminRouter";
import {UsersRegistry} from "../users/pds";
import createRouter from 'express-promise-router';

/**
 * Helper function to get the RecoEngine from the req.app context
 * @param app
 */
export function getRecoEngine(app: Application) {
    return app.get("recoEngine") as RecommandationEngine;
}

/**
 * Helper function to get the UserRegistry from the req.app context
 * @param app
 */
export function getUsersRegistry(app: Application) {
    return app.get("usersReg") as UsersRegistry;
}

export function createRecommandationServer(userRegistry: UsersRegistry, engine: RecommandationEngine) {
    const app = express();

    app.set("recoEngine", engine);
    app.set("usersReg", userRegistry);

    // decode URL-encoded parameters
    app.use(express.urlencoded({extended: true}));

    // parse all payloads as text
    app.use(express.text({type: "*/*"}));

    app.use((req, res, next) => {
        // currently : allow all external domains to access this API
        // TODO restrict to authorized domains
        res.header("Access-Control-Allow-Origin", "*");
        next();
    });

    const router = createRouter();
    app.use(router);

    router.use("/recommandations", RecommandationRouter());
    router.use("/admin", AdminRouter());

    return app;
}

