import {Resolver, Mutation, Query, Arg, FieldResolver, Root, UseMiddleware, Ctx} from'type-graphql'; 
import {Post} from '../entity/Post'; 
import {isAuth} from './middlewares/isAuth'; 
import { MyContext } from './types/MyContext';
import { Comment } from '../entity/Comment';

@Resolver(Comment)
export class CommentResolver {

    @FieldResolver()
    createdAt(@Root() comment: Comment) {
        if (comment.createdAt) return comment.createdAt.toISOString(); 
        else return comment.createdAt; 
    }


   @Mutation(() => Comment)
   @UseMiddleware(isAuth)
   async createComment(
       @Arg('postId') postId: number, 
       @Arg('text') text: string, 
       @Ctx() {payload}: MyContext
   ) {
        const post = await Post.findOne({id: postId}); 
        if(post) {
            const newComment = await Comment.create({text: text, postId: postId, userId: parseInt(payload.userId)}).save();
            return  newComment; 
        }
        else {
            return {}; 
        }
   }

   @Mutation(() => Boolean)
   @UseMiddleware(isAuth)
   async deleteComment(
       @Arg('id') id: number,
       @Ctx() {payload}: MyContext
    ){
        const result = await Comment.delete({id: id, userId: parseInt(payload.userId)});
        if (result.affected > 0) return true; 
        else return false; 
    }
}


