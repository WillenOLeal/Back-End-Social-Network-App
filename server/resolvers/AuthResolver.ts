import {Resolver, Mutation, Query, Arg, FieldResolver, Root, Field, InputType, ObjectType, Ctx} from'type-graphql'; 
import { getConnection } from 'typeorm';
import {User} from '../entity/User'; 
import * as bcrypt  from 'bcrypt'; 
import {UserInput} from './types/InputTypes'; 
import {UserInputError, AuthenticationError} from 'apollo-server-express';
import {MyContext} from './types/MyContext'; 
import {getAuthToken, getRefToken} from './utils/auth'; 
import {loginResponse} from './types/OutputTypes'
import {Profile} from '../entity/Profile';
import {setRefToken} from './utils/auth'; 
import { sendConfirmationEmail } from './utils/mailManagement';
import { createConfirmationUrl } from './utils/auth';
import {redis} from '../redisClient'; 



@Resolver(User)
export class AuthResolver {

    @FieldResolver()
    createdAt(@Root() user: User) {
        return user.createdAt.toISOString(); 
    }

   @Mutation(() => User)
   async register(
       @Arg('userInput', () => UserInput) userInput: UserInput, 
   ) {
       const {password, email, username} = userInput; 
       const user = await User.findOne({where: [{email: email.toLowerCase()}, {username: username.toLowerCase()}]}); 
       if (user) throw new UserInputError('This email or username is alreay taken'); 
        const hashedPassword = await bcrypt.hash(password, 12); 
        const newUser = await User.create({username: username.toLowerCase(), email: email.toLowerCase(), password: hashedPassword}).save(); 
        Profile.create({pictureName: "", userId: newUser.id}).save(); 
        sendConfirmationEmail(email,await createConfirmationUrl(newUser.id))
        return newUser; 
   }

   @Mutation(() => Boolean)
   async confirmUser(
       @Arg('uuid') uuid: string
   ){
       const userId = await redis.get(uuid); 
       if(!userId) return false; 
       else {
        await User.update({id: parseInt(userId)}, {emailConfirmed: true}); 
        await redis.del(uuid); 
        return true; 
       }
   }

   @Mutation(() => loginResponse)
   async login(
       @Arg('email') email: string,
       @Arg('password') password: string,
       @Ctx() {req, res}: MyContext
   ){
        const user = await User.findOne({where: {email: email.toLowerCase()}}); 
        if (!user) throw new AuthenticationError('Authentication failed. Invalid credentials'); 
        const isValid = await bcrypt.compare(password, user.password); 
        if(!isValid) throw new AuthenticationError('Authenctication failed. Invalid credentials'); 
        if(!user.emailConfirmed) throw new AuthenticationError('Account not activated'); 

        setRefToken(res, user); 
        return getAuthToken(user);  
   }

   @Mutation(() => Boolean)
   async  revokeRefreshToken(
       @Arg('userId') userId: number
   ){
        const result = await getConnection().getRepository(User).increment({id: userId}, 'tokenVersion', 1); 
        if(result.affected > 0) return true
        else return false; 
   }
}