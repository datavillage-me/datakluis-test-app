import {Request} from "express";


export function getIdentifiedUser(req: Request) {
    const credentials = {
        devId: req.headers['Auth-Space-Dev'],
        userId: req.headers['Auth-Space-User']
    }

    console.log(JSON.stringify(credentials));

    return credentials;
}

// TODO credentials verification does not work at the moment - headers don't seem to be passed through

export function requireDevRole(req: Request<any, any, any, any>) {
    //util.assert(getIdentifiedUser(req).devId, "No dev credentials in the request")
}

export function requireUserRole(req: Request<any, any, any, any>) {
    //util.assert(getIdentifiedUser(req).userId, "No user credentials in the request")
}