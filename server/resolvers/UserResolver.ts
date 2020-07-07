import {Resolver, Mutation, Query, Arg, FieldResolver, Root, Field, InputType, ObjectType, Ctx} from'type-graphql'; 
import {GraphQLUpload, FileUpload} from 'graphql-upload'; 
import {getConnection} from 'typeorm'; 
import {v4 as uuidv4} from 'uuid'; 
import { createWriteStream } from 'fs';
import {User} from '../entity/User'; 
import { Profile } from '../entity/Profile';
import {deleteProfilePicture} from './utils/fileManagement'

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
    async pictureUpload(
        @Arg('profileId') profileId: number, 
        @Arg("file", () => GraphQLUpload)
    {
      createReadStream,
      filename
    }: FileUpload): Promise<Boolean>  {
      const fileUniqueName = `${uuidv4()}_${filename}`
      return new Promise(async (resolve, reject) =>
        createReadStream()
          .pipe(createWriteStream(__dirname + `/../images/pictures/${fileUniqueName}`))
          .on("finish", async () => {
                getProfilePictureAndDelete(profileId)
                await Profile.update({id: profileId}, {pictureName: fileUniqueName }); 
                resolve(true)
            })
          .on("error", (err) => reject(false))
      );
    }

   @Mutation(() => Boolean)
   async deleteUser(
       @Arg('id') id: number
   ){
        const profile = await Profile.findOne({userId: id})
        getProfilePictureAndDelete(profile.id); 
        const result = await User.delete({id: id}); 
        if (result.affected > 0) return true; 
        else return false; 
   }
}

