import { graphql, GraphQLSchema } from 'graphql';
import {createSchema} from '../utils/createSchema'

interface Options {
    source: string, 
    variableValues?: {
        [key: string]: any
    }
}

let schema: GraphQLSchema; 

export const graphqlCall = async ({source, variableValues}: Options) => {
    if(!schema) schema = await createSchema(); 
    return graphql({
        schema,
        source, 
        variableValues
    }); 
}