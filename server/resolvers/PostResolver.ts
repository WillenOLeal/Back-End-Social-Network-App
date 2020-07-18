import {Resolver, Mutation, Query, Arg, FieldResolver, Root, InputType, Field, UseMiddleware, Ctx} from'type-graphql'; 
import { createWriteStream } from 'fs';
import {v4 as uuidv4} from 'uuid'; 
import {getConnection} from 'typeorm'; 
import {GraphQLUpload, FileUpload} from 'graphql-upload'; 
import {Post} from '../entity/Post'; 
import {User} from '../entity/User';
import {PostInput, PostUpdateInput} from './types/InputTypes'; 
import {isAuth} from './middlewares/isAuth'; 
import { MyContext } from './types/MyContext';
import {uploadResponse, getPostsResponse} from './types/OutputTypes';
import {deletePostImg} from './utils/fileManagement'; 
import {PaginationInput} from './types/InputTypes' ; 

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

    @FieldResolver()
    
        async likesCount(@Root() post: Post) {
            const {likescount} = await getConnection()
            .getRepository(Post)
            .createQueryBuilder('post')
            .select(['COUNT(users.id) AS likesCount'])
            .leftJoin('post.likes', 'users')
            .where('post.id = :id', {id: post.id})
            .getRawOne(); 

        return likescount; 
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
        const user = await User.findOne({where: {id: payload.userId}}); 
        post.user = user; 
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
    async updatePost(
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

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async likePostToggle(
        @Arg('id') id: number,
        @Ctx() {payload}: MyContext
    ){

        const post = await getConnection()
        .getRepository(Post)
        .createQueryBuilder('post')
        .select(['post.id', 'user.id'])
        .leftJoin('post.likes','user')
        .where('post.id = :id', {id: id})
        .getOne(); 
    

        if(!post) return false

        const user = await User.findOne({where: {id: payload.userId}}); 

        let hasLiked = false; 

        for(let userObj of post.likes){
            if(userObj.id == parseInt(payload.userId)) {
                hasLiked = true; 
                const likes = post.likes.filter(user => user.id !== parseInt(payload.userId))
                post.likes = [...likes]; 
                await post.save(); 
                return true; 
            }
        }

        if(!hasLiked){
            post.likes.push(user); 
            await post.save();
            return true; 
        }
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

    @Query(() => getPostsResponse)
    @UseMiddleware(isAuth)
    async getPosts(
        @Arg('paginationInput') {page, limit}: PaginationInput,
        @Ctx() {payload}: MyContext
    ){
        const take = limit || 10; 
        let skip = (page -1) * take; 
        if(page < 0){
            skip = 0; 
        } 

        const [result, total] = await Post.findAndCount({
            relations: ['user'], 
            where: {userId: payload.userId},
            take: take,
            skip: skip
        })

        return {
            posts: result, 
            total: total
        }
    }

    @Query(() => getPostsResponse)
    async getAllPosts(
        @Arg('paginationInput') {page, limit}: PaginationInput
    ){ 

        const take = limit || 10; 
        let skip = (page -1) * take; 
        if(page < 0){
            skip = 0; 
        } 

        const [result, total] = await Post.findAndCount({
            relations: ['user'], 
            take: take,
            skip: skip
        })

        return {
            posts: result, 
            total: total
        }
    }
}


