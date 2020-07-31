import {Resolver, Mutation, Query, Arg, FieldResolver, Root, Ctx} from'type-graphql'; 
import { getConnection } from 'typeorm';
import {User} from '../entity/User'; 
import * as bcrypt  from 'bcrypt'; 
import {UserInput} from './types/InputTypes'; 
import {UserInputError, AuthenticationError} from 'apollo-server-express';
import {MyContext} from './types/MyContext'; 
import {getAuthToken} from './utils/auth'; 
import {loginResponse} from './types/OutputTypes'
import {Profile} from '../entity/Profile';
import {setRefToken} from './utils/auth'; 


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
       const user = await User.findOne(
        {where: [
           {email: email.toLowerCase()},
           {username: username.toLowerCase()},
           {username: username},
        ]}); 
       if (user) throw new UserInputError('This email or username is alreay taken'); 
        const hashedPassword = await bcrypt.hash(password, 12); 
        const newUser = await User.create({username: username, email: email.toLowerCase(), password: hashedPassword}).save(); 
        Profile.create({pictureName: "", userId: newUser.id}).save(); 
        return newUser; 
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