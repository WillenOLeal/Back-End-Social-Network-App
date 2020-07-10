import {Resolver, Mutation, Query, Arg, FieldResolver, Root, InputType, Field, UseMiddleware, Ctx} from'type-graphql'; 
import { createWriteStream } from 'fs';
import {v4 as uuidv4} from 'uuid'; 
import {getConnection} from 'typeorm'; 
import {GraphQLUpload, FileUpload} from 'graphql-upload'; 
import {Post} from '../entity/Post'; 
import {PostInput, PostUpdateInput} from './types/InputTypes'; 
import {isAuth} from './middlewares/isAuth'; 
import { MyContext } from './types/MyContext';
import {uploadResponse} from './types/OutputTypes'
import {deletePostImg} from './utils/fileManagement'

const getPostImgAndDelete = async (postId: number, userId: string) => {
    const post = await getConnection()
    .getRepository(Post)
    .createQueryBuilder("post")
    .select([
        "post.imgName"
    ])
    .where("post.id = :id AND post.userId = :userId", { id:  postId, userId: userId})
    .getOne();

    if(post) deletePostImg(post.imgName); 
}

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


    @Mutation(() => uploadResponse)
    @UseMiddleware(isAuth)
    async postImageUpload(@Arg("file", () => GraphQLUpload)
    {
      createReadStream,
      filename
    }: FileUpload): Promise<uploadResponse> {
      const fileUniqueName = `${uuidv4()}_${filename}`
      return new Promise(async (resolve, reject) =>
        createReadStream()
          .pipe(createWriteStream(__dirname + `/../images/posts/${fileUniqueName}`))
          .on("finish", () => resolve({
              imgName: fileUniqueName,
              uploaded: true
          }))
          .on("error", (err) => reject({
            imgName: "",
            uploaded: false
        }))
      );
    }

   @Mutation(() => Post)
   @UseMiddleware(isAuth)
   async createPost(
       @Arg('postInput', () => PostInput) postInput: PostInput,
       @Ctx() {payload}: MyContext
   ) {
        const post = await Post.create({...postInput, userId: parseInt(payload.userId)}).save();
        return  post; 
   }

   @Mutation(() => Boolean)
   @UseMiddleware(isAuth)
   async deletePost(
       @Arg('id') id: number,
       @Ctx() {payload}: MyContext
    ){
        getPostImgAndDelete(id, payload.userId); 
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
        if (input.imgName)  getPostImgAndDelete(id, payload.userId); 

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
        const posts = await Post.find({ relations: ['user'] })
        console.log(posts)
        return posts; 
   }
}


