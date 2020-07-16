import {Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'; 
import {sign} from 'jsonwebtoken'; 
import {User} from '../../entity/User'; 
import {v4 as uuidv4} from 'uuid'; 
import {redis} from '../../redisClient'; 

export const setRefToken = (res: Response, user: User) => {
    res.cookie('sif', getRefToken(user) ,{
        httpOnly: true,
        expires: new Date(Date.now() + 600480000)
    });
}

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
    return sign({
        userId: user.id,
        tokenVersion: user.tokenVersion
        },process.env.REF_SECRET, {
            expiresIn: '7d'
    })
}

export const refreshToken = async (req: Request, res: Response) => {

    const RefreshToken = req.cookies.sif; 
    if(!RefreshToken) return res.send({ok: false, AuthToken: ""}) ; 

    let payload : any = null; 

    try {
        payload = jwt.verify(RefreshToken, process.env.REF_SECRET)
    }
    catch(err) {
        return res.send({ok: false, AuthToken: ""}) ; 
    }

    const user = await User.findOne({id: payload.userId})

    if(!user)  return res.send({ok: false, AuthToken: ""}) ; 

    if(user.tokenVersion != payload.tokenVersion)  return res.send({ok: false, AuthToken: ""}) ; 

    setRefToken(res, user); 
    return res.send({ok: true, authToken: getAuthToken(user).authToken}) ; 
}

export const createConfirmationUrl = async (userId: number) => {
    const uniqueId = uuidv4(); 

    await redis.set(uniqueId, userId, 'ex', 60 * 60 * 24) // 1 day 

    return `http://localhost/3000/accounts/confirm/${uniqueId}`; 
}