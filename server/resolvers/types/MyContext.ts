import {Request, Response} from 'express'; 
import { likesLoader } from '../../loaders/likesLoader';

export interface MyContext {
    req: Request, 
    res: Response, 
    payload?: {userId: string}, 
    likesLoader: ReturnType<typeof likesLoader> 
}