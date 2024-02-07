import { commandOptions, createClient, RedisClientType } from 'redis';
import {RedisCommandArgument} from "@redis/client/dist/lib/commands";

const CONSUMER_GROUP_NAME = 'consumers';

export class RedisQueue {
    private consumerGroup: string;
    private consumerName: string;
    private _redis: RedisClientType;

    constructor(redis: RedisClientType, consumerGroup: string = CONSUMER_GROUP_NAME, consumerName: string = 'consumer-0') {
        this.consumerGroup = consumerGroup;
        this.consumerName = consumerName;

        this._redis = redis || createClient();

        this._redis.on('error', err => console.log('Redis Client Error', err));
    }

    async createConsumerGroup() {
        try {
            await this._redis.xGroupCreate('events', this.consumerGroup, '0', { MKSTREAM: true });
        } catch (err) {
            if (err.toString().indexOf('BUSYGROUP') >= 0) return;
            else throw err;
        }
    }

    async destroyConsumerGroup() {
        await this._redis.xGroupDestroy('events', this.consumerGroup);
    }

    async listenOnce(timeout: number = 120000): Promise<{
        id: string;
        message: Record<string, string>;
    } | undefined> {
        const messages = await this._redis.xReadGroup(
            commandOptions({ isolated: true }),
            this.consumerGroup,
            this.consumerName,
            { key: 'events', id: '>' },
            { BLOCK: timeout, COUNT: 1, NOACK: true }
        );
        if (messages) {
            //console.log("EVENT MESSAGES: " + JSON.stringify(messages));
            return messages[0].messages[0];
        } else return undefined;
    }

    async listen(eventProcessor: (evt: {
        id: RedisCommandArgument;
        message: Record<string, string>;
    }) => void, timeout: number = 120000) {

        console.log(`Redis queue listening`);

        while (true) {
            // get next event
            const evt = await this.listenOnce(timeout);

            if (evt) {
                try {
                    //console.log("EVENT : " + JSON.stringify(evt));
                    eventProcessor(evt);
                } catch (err) {
                    console.warn(`Failed to process event ${evt.id} : ${err}`);
                }
            }
        }
    }

    async publish(data: any, createGroup: boolean = false) {
        if (createGroup)
            await this.createConsumerGroup();

        return this._redis.xAdd("events", "*", data)
    }

    get redis(): RedisClientType {
        return this._redis;
    }
}
