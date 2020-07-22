import {MiddlewareFn} from 'type-graphql'; 
import {MyContext} from '../types/MyContext';
import {AuthenticationError} from 'apollo-server-express';
import {verify} from 'jsonwebtoken'

export const isAuth: MiddlewareFn<MyContext> = ({context}, next) => {
    const authHeader = context.req.headers['authorization'];
    const token  = authHeader && authHeader.split(' ')[1]; 

    if(!token) throw new AuthenticationError('Not Authenticated')

    try{
        const payload = verify(token, process.env.AUTH_SECRET)
        context.payload = payload as any; 
    }
    catch(err) {
        throw new AuthenticationError('Not Authenticated'); 
    }
    return next(); 
}