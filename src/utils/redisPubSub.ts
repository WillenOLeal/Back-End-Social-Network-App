import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";
import "dotenv/config";

const options = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  retryStrategy: (times: any) => {
    return Math.min(times * 50, 2000);
  },
};

export default new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});
