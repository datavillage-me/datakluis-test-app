import {Request} from "express";
import {getRecoEngine} from "./index";
import {Recommendation} from "@datavillage-me/cage-template-core";
import createRouter from 'express-promise-router';
import {util} from "@datavillage-me/api";
import {requireDevRole} from "./auth";

export const RecommandationRouter = () => {
    const router = createRouter();

    router.get('/', async (req: Request<void, Recommendation[], void, { userId?: string }>, res) => {
        requireDevRole(req);

        util.assert(req.query.userId, "No userId provided");

        const engine = getRecoEngine(req.app);

        // TODO
        const recos = await engine.getRecommandations(req.query.userId);

        res.json(recos);
    });

    return router;
};