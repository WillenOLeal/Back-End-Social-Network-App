import * as DataLoader from "dataloader";
import {getConnection} from 'typeorm'; 
import {Post} from '../entity/Post'; 

type batchLike = (ids: number[]) => Promise<number[]>; 

const batchLikes: batchLike = async (ids) => {

    const posts = await getConnection()
        .getRepository(Post)
        .createQueryBuilder('post')
        .select(['post.id'])
        .leftJoin('post.likes', 'likes')
        .loadRelationCountAndMap('post.likes', 'post.likes')
        .where("post.id IN (:...ids)", { ids: ids })
        .getMany()

        const likesMap: {[key: number]: number} = {};
       
        posts.forEach(post => {
            likesMap[post.id as number] = post.likes as any
        }); 

        const likes = ids.map(id => likesMap[id]); 

        return likes; 
}

export const likesLoader = () => new DataLoader<number, number>(batchLikes)