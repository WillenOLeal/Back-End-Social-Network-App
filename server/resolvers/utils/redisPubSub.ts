import { RedisPubSub } from 'graphql-redis-subscriptions';
import * as Redis from 'ioredis';
 
const options = {
  host: '127.0.0.1',
  port: 6379,
  retryStrategy: (times: any) => {
    return Math.min(times * 50, 2000);
  }
};
 
export default new  RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options)
});