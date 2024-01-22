import {util, httputil} from "@datavillage-me/api";
import {Request, Response, NextFunction} from "express";
import {getLogger} from "log4js";

const log_http = getLogger('http');

export const ErrorHandler = (err: any, req: Request, res: Response, next?: NextFunction) => {
    if (err) {
        const httpError = httputil.processError(err);

        if (httpError.status >= 500) {
            log_http.error(httpError.toString());
            log_http.error('Original error : ', err);
            if (err instanceof util.WrappedError) log_http.error('Original error : ', err.getCause());
        } else {
            log_http.warn(httpError.toString());
            log_http.debug('Original error : ', err);
            if (err instanceof util.WrappedError && log_http.isDebugEnabled()) log_http.error('Original error : ', err.getCause());
        }

        res.status(httpError.status);

        if (req.headers['accept'] == 'application/json') {
            res.json({
                message: httpError.message
            });
        } else {
            // TODO handle 401 with a redirect ?
            res.send(httpError.message);
        }
    }
};