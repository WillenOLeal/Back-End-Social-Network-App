import {Resolver, Mutation, Query, Arg, FieldResolver, Root, Subscription, Ctx, UseMiddleware, PubSub} from'type-graphql';
import { PubSubEngine } from 'graphql-subscriptions';
import { getRepository } from 'typeorm'; 
import {GraphQLUpload, FileUpload} from 'graphql-upload'; 
import {getConnection} from 'typeorm'; 
import {v4 as uuidv4} from 'uuid'; 
import {User} from '../entity/User'; 
import { Profile } from '../entity/Profile';
import {isAuth} from './middlewares/isAuth'; 
import {MyContext} from './types/MyContext'; 
import {Friendship} from '../entity/Friendship'; 
import { SenderPlusReceiverId } from "./types/varTypes";
import { uploadToS3FromStream, deleteImgFromS3 } from './utils/aws-utils';

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

    if(profile) deleteImgFromS3(profile.pictureName, 'profiles'); 
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
      filename,
      mimetype
    }: FileUpload): Promise<Boolean>  {
      const fileUniqueName = `${uuidv4()}_${filename}`
      const {writeSream, promise} = uploadToS3FromStream(fileUniqueName, mimetype, 'profiles'); 
      return new Promise(async (resolve, reject) =>
        createReadStream()
          .pipe(writeSream)
          .on("finish", async () => {
                try{
                  await promise; 
                  const profile = await Profile.findOne({userId: payload.userId});
                  getProfilePictureAndDelete(profile.id);
                  await Profile.update({id: profile.id}, {pictureName: fileUniqueName }); 
                  return resolve(true)
                }
                catch(err){
                  return resolve(false);
                }
            })
          .on("error", () => reject(false))
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

      const friendship = await Friendship.findOne({where: [
        {senderId: payload.userId, receiverId: userId},
        {senderId: userId, receiverId: payload.userId}
      ]})

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
        if (result.affected > 0) {
          getConnection().queryResultCache.remove([`${payload.userId}-getFriendsQuery`]); 
          return true;
        }
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

