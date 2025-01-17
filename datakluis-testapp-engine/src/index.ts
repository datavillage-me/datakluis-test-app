import {createClient, RedisClientType} from "redis";
import {UsersRegistry} from "./users/pds";
import {RecommandationEngine} from "./engine/engine";
import {createRecommandationServer} from "./express";

import https from "https";
import fs from "fs";
import {util, getRemoteClient} from "@datavillage-me/api";
import express from "express";
import dotenv from 'dotenv';
import {RedisClientOptions} from "@redis/client";
import {DatavillageUsersRegistry} from "./users/datavillage";
import log4js from 'log4js';
import {ErrorHandler} from "./express/error";
import {RedisQueue} from "./redis";
import {RedisCommandArgument} from "@redis/client/dist/lib/commands";
import {EVENT_TYPES} from "@datavillage-me/cage-template-core";


// add some colours to the logging
const originalWarn = console.warn;
console.warn = (msg, ...params) => originalWarn(`\x1b[33m${msg}\x1b[0m`, ...params)
const originalError = console.error;
console.error = (msg, ...params) => originalError(`\x1b[31m${msg}\x1b[0m`, ...params)
const originalDebug = console.debug;
console.debug = (msg, ...params) => originalDebug(`\x1b[90m${msg}\x1b[0m`, ...params)
const originalInfo = console.info;
console.info = (msg, ...params) => originalInfo(`\x1b[34m${msg}\x1b[0m`, ...params)

dotenv.config();

log4js.configure({
    appenders: {
        //serverLogs: { type: 'file', filename: 'template-engine.log' },
        console: {type: 'console'}
    },
    categories: {
        default: {appenders: ['console'], level: 'debug'}
    }
});


/**
 * Get the env variables provided by the Datavillage platform
 */
const config = {
    DV_TOKEN: process.env.DV_TOKEN,
    DV_APP_ID: process.env.DV_APP_ID,
    DV_CLIENT_ID: process.env.DV_CLIENT_ID,
    DV_URL: process.env.DV_URL,
    REDIS_SERVICE_HOST: process.env.REDIS_SERVICE_HOST,
    REDIS_SERVICE_PORT: process.env.REDIS_SERVICE_PORT,
    TLS_CAFILE: process.env.TLS_CAFILE,
    REDIS_TLS: process.env.REDIS_TLS
}

async function createEngine(userRegistry: UsersRegistry) {
    const engine = new RecommandationEngine(userRegistry);

    return engine;
}


/**
 * The settings that can be publicly exposed by this app
 * and possibly be reused by frontends to articulate with other services
 */
// TODO strong-type these
let serverSettings: {
    "DV_APP_ID": string,
    "DV_CLIENT_ID": string,
    "DV_SETTINGS": {
        apiUrl: string,
        loginUrl: string,
        passportUrl: string,
        consoleUrl: string,
    }
} | undefined = undefined;


/**
 *
 * @param userRegistry
 * @param engine
 */
export async function startExpress(userRegistry: UsersRegistry, engine: RecommandationEngine) {
    // check the env variables to see if HTTPS should be enabled
    const useHttps = !!(process.env.TLS_CERTFILE && process.env.TLS_KEYFILE);

    // create the server
    const app = createRecommandationServer(userRegistry, engine);

    // expose the settings to make them available to the frontend(s)
    app.get("/settings.json", (req, res) => {
        res.json(serverSettings);
    });
    // expose static resources if any
    app.use(express.static(__dirname + '/static'));

    // some handy error handling
    app.use(ErrorHandler);

    const server = useHttps ?
        https.createServer({
            // get the TLS resources provided by the hosting platform
            key: fs.readFileSync(process.env.TLS_KEYFILE!),
            cert: fs.readFileSync(process.env.TLS_CERTFILE!),
        }, app) :
        app;

    const PORT = process.env.PORT || (useHttps ? 5443 : 5000)

    server.listen(PORT, async () => {
        console.log(`Recommandation Server listening on ${useHttps ? 'HTTPS' : 'HTTP'}:${PORT}`);

        // Do post-start init
    });

    return server;
}

// Connect to Redis - again, decide whether to use HTTPS based on env variables
const useRedisHttps = config.TLS_CAFILE || new Boolean(config.REDIS_TLS).valueOf();
console.log(`Connecting to Redis on ${useRedisHttps ? 'https' : 'http'}://${config.REDIS_SERVICE_HOST}:${config.REDIS_SERVICE_PORT} ...`)

// create Redis graph client
const socket: RedisClientOptions['socket'] = useRedisHttps ?
    {
        tls: true,
        ca: config.TLS_CAFILE ? fs.readFileSync(config.TLS_CAFILE) : undefined,
        host: config.REDIS_SERVICE_HOST || 'localhost',
        port: config.REDIS_SERVICE_PORT ? parseInt(config.REDIS_SERVICE_PORT) : undefined,
        checkServerIdentity: () => {
            return undefined;
        },
    } :
    {
        tls: false,
        host: config.REDIS_SERVICE_HOST || 'localhost',
        port: config.REDIS_SERVICE_PORT ? parseInt(config.REDIS_SERVICE_PORT) : undefined
    };
const redis: RedisClientType = createClient({socket});
redis.on('error', err => console.log('Redis Client Error', err));
redis.on('end', () => {
    console.log('Redis connection ended');
});

const redisEventProcessor = (engine: RecommandationEngine) => (async (evt: {
    id: RedisCommandArgument;
    message: EVENT_TYPES;
}) => {
    const originalMessage = evt.message.msg_data ? JSON.parse(evt.message.msg_data) : undefined;
    const type = originalMessage?.type;

    switch (type) {
        case 'PING':
            // produce recommendations for all users
            console.log(`Event PING ${evt.id}`);
            break;
        case 'PROCESS_USERS':
        // produce recommendations for all users
            await engine.createAndStoreRecommandationsForUsers(undefined, originalMessage.email);
            break;
        default:
            console.log(`Unknown event ${evt.id}: type ${type}`);
            console.log(JSON.stringify(evt, undefined, 4));
            break;
    }
})

// Initiate the redis connection
redis.connect()
    .catch(err => {
        throw new Error("Failed to connect to Redis Graph server: " + err)
    })
    .then(async () => {
        console.log('Connected to Redis');
        //console.log((await redis.INFO()));

        let usersReg: UsersRegistry;

        // Test from the env variables if we are hosted within a Datavillage platform
        if (config.DV_URL && config.DV_TOKEN && config.DV_CLIENT_ID && config.DV_APP_ID) {
            try {
                const dvServerMetadata = await fetch(new URL("metadata.json", config.DV_URL).toString()).then(resp => resp.json());
                const dvServerSettings = await fetch(new URL("service.json", config.DV_URL).toString()).then(resp => resp.json());

                // set these as a global variable so they can be returned by the '/settings.json' endpoint
                serverSettings = {
                    "DV_APP_ID": config.DV_APP_ID,
                    "DV_CLIENT_ID": config.DV_CLIENT_ID,
                    "DV_SETTINGS": dvServerSettings
                }

                const dvClient = getRemoteClient(config.DV_URL, config.DV_TOKEN);
                console.log(`Datacage deployment - using DV Platform at ${config.DV_URL} for client ${config.DV_CLIENT_ID}, app ${config.DV_APP_ID}`);
                console.log(`DV Backend version ${dvServerMetadata.npm_version} (${dvServerMetadata.git_ref}) built on ${dvServerMetadata.build_date}`);
                console.log(`DV Public API URL  ${serverSettings.DV_SETTINGS.apiUrl}`);
                console.log(`DV Passport URL    ${serverSettings.DV_SETTINGS.passportUrl}`);
                console.log(`DV Console URL     ${serverSettings.DV_SETTINGS.consoleUrl}`);
                const podStatus = await dvClient.getCollaborationSpacesServices().getOperatorServices(config.DV_APP_ID).getPodStatus();
                const algoPod = podStatus.find(p => p.name.startsWith('algo-'));
                console.log(`Pod Identifier     ${algoPod?.namespace} / ${algoPod?.name}`);
                console.log(`Docker  image      ${algoPod?.imageId}`);
                console.info(`Proxy to redis using `);
                console.info(`$> kubectl port-forward redis-0 6379:6379 -n ${algoPod?.namespace} `);

                // check the connectivity to the DV backend and the validity of the credentials
                const credentials = await dvClient.getPassport().getCurrentCredentials().catch(err => {
                    throw new util.WrappedError("Failed to connect to DV backend", err)
                });
                console.debug("Connected to DV backend with credentials : " + JSON.stringify(credentials));
                if (credentials?.spaceId != config.DV_APP_ID) {
                    console.warn(`Provided credentials do not match the space ID (DV_APP_ID = ${config.DV_APP_ID}). \n Check the provided DV_TOKEN if this is not intentional.`)
                }

                usersReg = new DatavillageUsersRegistry(dvClient, config.DV_CLIENT_ID, config.DV_APP_ID);
            } catch (err) {
                throw new util.WrappedError("Failed to setup connection with Datavillage backend at " + config.DV_URL, err);
            }
        } else {
            // We're outside the DV platform
            // TODO

            throw new Error("Not supported : running outside DV platform");
        }

        // Create the recommendation engine
        const engine = await createEngine(usersReg);
        console.log(`Recommandation engine ready`)

        const eventQueue = new RedisQueue(redis);
        await eventQueue.createConsumerGroup();
        eventQueue.listen(redisEventProcessor(engine));

        await startExpress(usersReg, engine);
    });


