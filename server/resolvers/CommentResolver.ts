import {Resolver, Mutation, Query, Arg, FieldResolver, Root, UseMiddleware, Ctx} from'type-graphql'; 
import {Post} from '../entity/Post'; 
import {isAuth} from './middlewares/isAuth'; 
import { MyContext } from './types/MyContext';
import { Comment } from '../entity/Comment';
import {User} from '../entity/User'; 
import {PaginationInput, PostUpdateInput} from './types/InputTypes'
import { getCommentsResponse } from './types/OutputTypes';

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
            const user = await  User.findOne({id: parseInt(payload.userId)}); 
            newComment.user = user; 
            return newComment; 
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

    @Query(() => getCommentsResponse)
    async getComments(
        @Arg('postId') postId: number, 
        @Arg('paginationInput')  {page, limit}: PaginationInput
        ) {
            const take = limit || 10; 
            let skip = (page -1) * take; 
            if(page < 0){
                skip = 0; 
            } 

            const [result, total] = await Comment.findAndCount({
                relations: ['user'], 
                where: {postId: postId},
                take: take,
                skip: skip
            })

            return {
                comments: result, 
                total: total
            }
    }
}


