import DataLoader from "dataloader";
import {getConnection} from 'typeorm'; 
import {Post} from '../entity/Post'; 

interface ArgList  {
    id: number, 
    userId: number
}

const batchHasLikes = async (args: any) => {

    const ids: number[] = args.map((arg: any) => arg.id);
    const userId: number = args[0].userId; 

    const posts = await getConnection()
        .getRepository(Post)
        .createQueryBuilder('post')
        .loadAllRelationIds({ relations: ['likes'] })
        .where("post.id IN (:...ids)", { ids: ids })
        .getMany(); 

        const hasLikedMap: {[key: number]: boolean} = {};
       
        posts.forEach(post => {
            hasLikedMap[post.id as number] = post.likes.includes(userId as any);
        }); 
        
        const hasLikedArray = ids.map(id => hasLikedMap[id]); 

        return hasLikedArray; 
}

export const hasLikedPostLoader = () => new DataLoader<ArgList, boolean>(batchHasLikes)