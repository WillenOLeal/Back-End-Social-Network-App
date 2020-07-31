import {buildSchema} from 'type-graphql'
import RedisPubSub from './redisPubSub';

export const createSchema = async () => {
    return await buildSchema({
        resolvers: [__dirname + '/../resolvers/*.ts'],
        pubSub: RedisPubSub
    })
}