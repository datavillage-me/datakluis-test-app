import {Request} from "express";
import {getRecoEngine} from "./index";
import {Recommendation} from "@datavillage-me/cage-template-core";
import createRouter from 'express-promise-router';

export const RecommandationRouter = () => {
    const router = createRouter();

    /**
     * Return the full EPC document by URI
     */
    router.get('/', async (req: Request<void, Recommendation[], void, { userId?: string }>, res) => {
        const engine = getRecoEngine(req.app);

        // TODO
        const recos = await engine.getRecommandations(req.query.userId);

        res.json(recos);
    });

    return router;
};