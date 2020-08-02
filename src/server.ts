import "reflect-metadata";
import {createConnection} from "typeorm";
import express from "express"; 
import http from 'http'; 
import path from 'path'; 
import {ApolloServer} from "apollo-server-express" 
import {graphqlUploadExpress} from 'graphql-upload'; 
import {refreshToken} from './resolvers/utils/auth'
import cookieParser from 'cookie-parser';
import { likesPostLoader } from "./loaders/likesPostLoader";
import { likesCommentLoader } from "./loaders/likesCommentLoader";
import { verifyAuthTokenOverWebSocket } from './resolvers/utils/auth';
import {createSchema} from './utils/createSchema';
import 'dotenv/config';


(async () => {
    const app = express(); 
    await createConnection(); 

    app.use('/images/posts', express.static(path.join(__dirname, '/images/posts'))); 
    app.use('/images/profiles', express.static(path.join(__dirname, '/images/profiles'))); 
    app.use(cookieParser()); 
    app.post('/refresh-token', refreshToken); 

    app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

    const apolloServer = new ApolloServer({
        schema: await createSchema(),
        context: ({req, res, connection}) =>  {
            if(!req || !req.headers)
                return connection.context; 
            else
                return {
                    req,
                    res,
                    likesPostLoader: likesPostLoader(),
                    likesCommentLoader: likesCommentLoader()
                }
        },
        subscriptions: {
            onConnect: async (connectionParams, webScoket) => {
                const payload = await verifyAuthTokenOverWebSocket(connectionParams)
                return payload; 
            }
        },
        uploads: false
    }); 

    apolloServer.applyMiddleware({
        app, cors: false
    })

    const httpServer = http.createServer(app);
    apolloServer.installSubscriptionHandlers(httpServer);

    httpServer.listen(3000, () => {
        console.log("Listening on port 3000"); 
    })
})();