import {Request, Response} from 'express'; 
import { likesPostLoader } from '../../loaders/likesPostLoader';
import { likesCommentLoader } from '../../loaders/likesCommentLoader';
import { hasLikedPostLoader } from "../../loaders/postHasLikedLoader";

export interface MyContext {
    req: Request, 
    res: Response, 
    payload?: {userId: number}, 
    likesPostLoader: ReturnType<typeof likesPostLoader>, 
    likesCommentLoader: ReturnType<typeof likesCommentLoader>
    hasLikedPostLoader: ReturnType<typeof hasLikedPostLoader>
}