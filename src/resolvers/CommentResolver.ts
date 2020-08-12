import {Resolver, Mutation, Query, Arg, FieldResolver, Root, UseMiddleware, Ctx, Int} from'type-graphql'; 
import {getConnection, Any} from 'typeorm'; 
import {Post} from '../entity/Post'; 
import {isAuth} from './middlewares/isAuth'; 
import { MyContext } from './types/MyContext';
import { Comment } from '../entity/Comment';
import {User} from '../entity/User'; 
import {PaginationInput} from './types/InputTypes'
import { getCommentsResponse } from './types/OutputTypes';

@Resolver(Comment)
export class CommentResolver {

    @FieldResolver()
    createdAt(@Root() comment: Comment) {
        if (comment.createdAt) return comment.createdAt.toISOString(); 
        else return comment.createdAt; 
    }

    @FieldResolver()
    likesCount(
        @Root() comment: Comment,
        @Ctx() {likesCommentLoader}: MyContext
    ) {
        return likesCommentLoader.load(comment.id); 
    }

   @Mutation(() => Comment, {nullable: true})
   @UseMiddleware(isAuth)
   async createComment(
       @Arg('postId', () => Int) postId: number, 
       @Arg('text') text: string, 
       @Ctx() {payload}: MyContext
   ) {
        const post = await Post.findOne({id: postId}); 
        if(post) {
            const newComment = await Comment.create({text: text, postId: postId, userId: payload.userId}).save();
            const user = await  User.findOne({id: payload.userId}); 
            newComment.user = user; 
            return newComment; 
        }
        else {
            return null; 
        }
   }

   @Mutation(() => Boolean)
   @UseMiddleware(isAuth)
   async deleteComment(
       @Arg('id', () => Int) id: number,
       @Ctx() {payload}: MyContext
    ){
        const result = await Comment.delete({id: id, userId: payload.userId});
        if (result.affected > 0) return true; 
        else return false; 
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async likeCommentToggle(
        @Arg('id', () => Int) id: number,
        @Ctx() {payload}: MyContext
    ){

        const comment = await getConnection()
        .getRepository(Comment)
        .createQueryBuilder('comment')
        .select(['comment.id', 'user.id'])
        .leftJoin('comment.likes','user')
        .where('comment.id = :id', {id: id})
        .getOne(); 

        if(!comment) return false

        const user = await User.findOne({where: {id: payload.userId}}); 

        let hasLiked = false; 
        
        for(let userObj of comment.likes){
            if(userObj.id == payload.userId) {
                hasLiked = true; 
                const likes = comment.likes.filter(user => user.id !== payload.userId)
                comment.likes = [...likes]; 
                await comment.save(); 
                return true; 
            }
        }

        if(!hasLiked){
            comment.likes.push(user); 
            await comment.save();
            return true; 
        }
       
    }

    @Query(() => getCommentsResponse)
    @UseMiddleware(isAuth)
    async getComments(
        @Arg('postId', () => Int) postId: number, 
        @Arg('paginationInput')  {page, limit}: PaginationInput
    ){
        const take = limit || 10; 
        let skip = (page -1) * take; 
        if(page < 0) {
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


