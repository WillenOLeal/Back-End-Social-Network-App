import "reflect-metadata";
import {createConnection} from "typeorm";
import * as express from "express"; 
import * as path from 'path'; 
import {ApolloServer} from "apollo-server-express"
import {buildSchema} from 'type-graphql'; 
import { AuthResolver } from "./resolvers/AuthResolver";
import {PostResolver}from './resolvers/PostResolver'; 
import {UserResolver} from './resolvers/UserResolver'; 
import {CommentResolver} from './resolvers/CommentResolver'; 
import {graphqlUploadExpress} from 'graphql-upload'; 
import {refreshToken} from './resolvers/utils/auth'
import * as cookieParser from 'cookie-parser';

import * as dotenv from 'dotenv'

dotenv.config(); 

(async () => {
    const app = express(); 
    await createConnection(); 

    app.use('/images/posts', express.static(path.join(__dirname, '/images/posts'))); 
    app.use('/images/profiles', express.static(path.join(__dirname, '/images/profiles'))); 
    app.use(cookieParser()); 
    app.post('/refresh-token', refreshToken); 

    app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [AuthResolver, UserResolver, PostResolver, CommentResolver]
        }),
        context: ({req, res}) => ({req, res}),
        uploads: false
    }); 

    apolloServer.applyMiddleware({
        app, cors: false
    })

    app.listen(3000, () => {
        console.log("Listening on port 3000"); 
    })
})();