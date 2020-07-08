import {Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'; 
import {sign} from 'jsonwebtoken'; 
import {User} from '../../entity/User'; 

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
    return  sign({
        userId: user.id
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

    setRefToken(res, user); 
    return res.send({ok: true, authToken: getAuthToken(user).authToken}) ; 
}