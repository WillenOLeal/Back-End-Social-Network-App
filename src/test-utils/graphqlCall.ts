import { graphql, GraphQLSchema } from 'graphql';
import {createSchema} from '../utils/createSchema'


interface Options {
    source: string, 
    variableValues?: {
        [key: string]: any
    }
    userId?: number
}

let schema: GraphQLSchema; 


export const graphqlCall = async ({source, variableValues, userId}: Options) => {

    if(!schema) schema = await createSchema(); 
    return graphql({
        schema,
        source, 
        variableValues, 
        contextValue: {
            req: {
                
            },
            res: {
                cookie: jest.fn()
            },
            payload: {
                uaserId: userId
            }
        }
    }); 
}