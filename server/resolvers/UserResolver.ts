import {Resolver, Mutation, Query, Arg, FieldResolver, Root, Field, InputType, ObjectType, Ctx, UseMiddleware} from'type-graphql'; 
import {GraphQLUpload, FileUpload} from 'graphql-upload'; 
import {getConnection} from 'typeorm'; 
import {v4 as uuidv4} from 'uuid'; 
import { createWriteStream } from 'fs';
import {User} from '../entity/User'; 
import { Profile } from '../entity/Profile';
import {deleteProfilePicture} from './utils/fileManagement'
import {isAuth} from './middlewares/isAuth'; 
import {MyContext} from './types/MyContext'; 

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
                const profile = await Profile.findOne({userId: parseInt(payload.userId)});
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
        const profile = await Profile.findOne({userId: parseInt(payload.userId)})
        getProfilePictureAndDelete(profile.id); 
        const result = await User.delete({id: parseInt(payload.userId)}); 
        if (result.affected > 0) return true; 
        else return false; 
   }
}

