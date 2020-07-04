import "reflect-metadata";
import {createConnection} from "typeorm";
import * as express from "express"; 
import {ApolloServer} from "apollo-server-express"
import {buildSchema} from 'type-graphql'
import {HelloWorldResolver} from './resolvers/HelloWorldTesolver'
import { AuthResolver } from "./resolvers/AuthResolver";
import {PostResolver}from './resolvers/PostResolver'; 
import * as dotenv from 'dotenv'

dotenv.config(); 

(async () => {
    const app = express(); 
    await createConnection(); 

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloWorldResolver, AuthResolver, PostResolver]
        }),
        context: ({req, res}) => ({req, res}),
    }); 

    apolloServer.applyMiddleware({
        app, cors: false
    })

    app.listen(5000, () => {
        console.log("Listening on port 5000"); 
    })
})();