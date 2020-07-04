import {Resolver, Mutation, Query, Arg, FieldResolver, Root, InputType, Field, UseMiddleware, Ctx} from'type-graphql'; 
import {Post} from '../entity/Post'; 
import {PostInput, PostUpdateInput} from './types/InputTypes'; 
import {isAuth} from './middlewares/isAuth'; 
import { MyContext } from './types/MyContext';

@Resolver(Post)
export class PostResolver {

    @FieldResolver()
    createdAt(@Root() post: Post) {
        return post.createdAt.toISOString(); 
    }

    @FieldResolver()
    updatedAt(@Root() post: Post) {
        return post.createdAt.toISOString(); 
    }

   @Mutation(() => Post)
   @UseMiddleware(isAuth)
   async createPost(
       @Arg('postInput', () => PostInput) postInput: PostInput,
       @Ctx() {payload}: MyContext
   ) {
       console.log(payload.userId); 
        const post = await Post.create({...postInput, userId: parseInt(payload.userId)}).save();
        return  post; 
   }

   @Mutation(() => Boolean)
   @UseMiddleware(isAuth)
   async deletePost(
       @Arg('id') id: number,
       @Ctx() {payload}: MyContext
    ){
        const result = await Post.delete({id: id, userId: parseInt(payload.userId)});
        if (result.affected > 0) return true; 
        else return false; 
    }

    @Mutation(() => Post, {nullable: true})
    @UseMiddleware(isAuth)
    async upatePost(
        @Arg('id') id: number, 
        @Arg('input') input: PostUpdateInput,
        @Ctx() {payload}: MyContext
     ){
         const result = await Post.update({id: id, userId: parseInt(payload.userId)}, input)
         if (result.affected > 0) 
            return await Post.findOne({id: id}); 
         else return null; 
     }

   @Query(() => Post)
   @UseMiddleware(isAuth)
   async getPost(
       @Arg('id') id: number,
       @Ctx() {payload}: MyContext
    ){
        const post = await Post.findOne({id: id, userId: parseInt(payload.userId)}); 
        return post; 
   }

   @Query(() => [Post])
   @UseMiddleware(isAuth)
   async getPosts(
    @Ctx() {payload}: MyContext
   ){
        const posts = await Post.find({userId: parseInt(payload.userId)})
        return posts; 
   }

   @Query(() => [Post])
   async getAllPosts(){
        const posts = await Post.find()
        return posts; 
   }

}