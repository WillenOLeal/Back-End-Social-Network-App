import {Resolver, Mutation, Query, Arg, FieldResolver, Root, Subscription, Ctx, UseMiddleware, PubSub} from'type-graphql';
import { PubSubEngine } from 'graphql-subscriptions';
import { getRepository } from 'typeorm'; 
import {GraphQLUpload, FileUpload} from 'graphql-upload'; 
import {getConnection} from 'typeorm'; 
import {v4 as uuidv4} from 'uuid'; 
import { createWriteStream } from 'fs';
import {User} from '../entity/User'; 
import { Profile } from '../entity/Profile';
import {deleteProfilePicture} from './utils/fileManagement'
import {isAuth} from './middlewares/isAuth'; 
import {MyContext} from './types/MyContext'; 
import {Friendship} from '../entity/Friendship'; 
import { inspect } from "util";
import { SenderPlusReceiverId } from "./types/varTypes";

const friendReq = 'FRIEND_REQ'; 

const getProfilePictureAndDelete = async (profileId: number) => {
    const profile = await getConnection()
    .getRepository(Profile)
    .createQueryBuilder("profile")
    .select([
        "profile.pictureName"
    ])
    .where("profile.id = :id" , { id:  profileId})
    .getOne();

    if(profile) deleteProfilePicture(profile.pictureName); 
}

@Resolver(User)
export class UserResolver {

    @FieldResolver()
    createdAt(@Root() user: User) {
        return user.createdAt.toISOString(); 
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async pictureUpload(
        @Arg("file", () => GraphQLUpload)
        @Ctx() {payload}: MyContext,
    {
      createReadStream,
      filename
    }: FileUpload): Promise<Boolean>  {
      const fileUniqueName = `${uuidv4()}_${filename}`
      return new Promise(async (resolve, reject) =>
        createReadStream()
          .pipe(createWriteStream(__dirname + `/../images/profiles/${fileUniqueName}`))
          .on("finish", async () => {
                const profile = await Profile.findOne({userId: payload.userId});
                getProfilePictureAndDelete(profile.id);
                await Profile.update({id: profile.id}, {pictureName: fileUniqueName }); 
                resolve(true)
            })
          .on("error", (err) => reject(false))
      );
    }

   @Mutation(() => Boolean)
   @UseMiddleware(isAuth)
   async deleteUser(
       @Ctx() {payload}: MyContext
   ){
        const profile = await Profile.findOne({userId: payload.userId})
        getProfilePictureAndDelete(profile.id); 
        const result = await User.delete({id: payload.userId}); 
        if (result.affected > 0) return true; 
        else return false; 
   }

   @Mutation(() => Boolean)
   @UseMiddleware(isAuth)
   async addFriend(
     @PubSub() pubSub: PubSubEngine,
     @Arg('useerId') userId: number,
     @Ctx() {payload}: MyContext
   ){
    
     if(payload.userId == userId) return false; 

     const receiver = await User.findOne({id: userId}); 
     if(!receiver) return false; 

     const friendship = await Friendship.findOne({senderId: payload.userId, receiverId: userId})

     if(friendship) return false; 

     const sender = await User.findOne({id: payload.userId}); 
     const senderPlusReceiverId: SenderPlusReceiverId = {...sender, receiverId: receiver.id}; 

     
     const pubSubPromise = pubSub.publish(friendReq, senderPlusReceiverId);
     const friendsPromise = Friendship.insert({senderId: payload.userId, receiverId: userId, status: 0}); 

      await Promise.all([pubSubPromise, friendsPromise]); 
      return true; 
   }

   @Mutation(() => Boolean)
   @UseMiddleware(isAuth)
   async confirmFriendRequest(
     @Arg('userId') userId: number, 
     @Ctx() {payload}: MyContext
   ){
      if(payload.userId == userId) return false; 
      const friendship = await Friendship.findOne({senderId: userId, receiverId: payload.userId, status: 0}); 

      if(friendship) {
        const result = await Friendship.update({senderId: userId, receiverId: payload.userId, status: 0}, {status: 1})
        if (result.affected > 0) return true;
      }

      return false; 

   }

   @Query(() => [User], {nullable: true})
   @UseMiddleware(isAuth)
   async getUsers(
     @Arg('username') username: string
    ){
      const users = await getRepository(User)
      .createQueryBuilder("user")
      .where("user.username like :username", {username: `%${username}%` })
      .getMany();
      
      return users; 
   }


    @Subscription(returns => SenderPlusReceiverId, {
      topics: friendReq,
      filter: ({ payload, args, context }) => payload.receiverId === context.userId
    })
    AwaitFriendRequest(@Root() senderPlusReceiverId: SenderPlusReceiverId) {
      return senderPlusReceiverId;
    }
}

