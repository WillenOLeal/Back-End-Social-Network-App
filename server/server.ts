import "reflect-metadata";
import {createConnection} from "typeorm";
import * as express from "express"; 
import {ApolloServer} from "apollo-server-express"
import {buildSchema} from 'type-graphql'
import { AuthResolver } from "./resolvers/AuthResolver";
import {PostResolver}from './resolvers/PostResolver'; 
import {UserResolver} from './resolvers/UserResolver'
import {graphqlUploadExpress} from 'graphql-upload'
import * as dotenv from 'dotenv'

dotenv.config(); 

(async () => {
    const app = express(); 
    await createConnection(); 

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [AuthResolver, PostResolver, UserResolver]
        }),
        context: ({req, res}) => ({req, res}),
        uploads: false
    }); 

    app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

    apolloServer.applyMiddleware({
        app, cors: false
    })

    app.listen(3000, () => {
        console.log("Listening on port 3000"); 
    })
})();