import {sign} from 'jsonwebtoken'; 
import {User} from '../../entity/User'; 

export const getAuthToken = (user: User) => {
    
    return {
        authToken: sign({
            userId: user.id
        },process.env.AUTH_SECRET, {
            expiresIn: '15m'
        })
    }; 
}

export const getRefToken = (user: User) => {
    return  sign({
        userId: user.id
        },process.env.REF_SECRET, {
            expiresIn: '7d'
    })
}