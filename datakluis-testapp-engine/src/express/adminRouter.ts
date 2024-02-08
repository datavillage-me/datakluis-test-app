import {Request} from "express";
import createPromiseRouter from 'express-promise-router';
import {getUsersRegistry} from "./index";
import {requireDevRole} from "./auth";

/**
 * A set of endpoints to administrate the engine itself.
 * Should be accessible only to admin roles.
 * @constructor
 */
export const AdminRouter = () => {
    const router = createPromiseRouter();

    /**
     * Return the list of registered users
     */
    router.get('/users', async (req: Request<void, any, void, void>, res) => {

        requireDevRole(req);

        // retrieve the user registry from the app context
        const userReg = getUsersRegistry(req.app);

        const users = await userReg.getUsers();

        res.json(users);
    });


    return router;
};