import {Resolver, Mutation, Query, Arg, FieldResolver, Root, Field, InputType, ObjectType, Ctx} from'type-graphql'; 
import {User} from '../entity/User'; 
import * as bcrypt  from 'bcrypt'; 
import {UserInput} from './types/InputTypes'; 
import {UserInputError, AuthenticationError} from 'apollo-server-express';
import {MyContext} from './types/MyContext'; 
import {getAuthToken, getRefToken} from './utils/auth'; 
import {loginResponse} from './types/OutputTypes'
import {Profile} from '../entity/Profile';

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
       const {password, email} = userInput; 
       const user = await User.findOne({where: {email: email.toLowerCase()}}); 
       if (user) throw new UserInputError('This email is alreay taken'); 
        const hashedPassword = await bcrypt.hash(password, 12); 
        const newUser = await User.create({email: email.toLowerCase(), password: hashedPassword}).save(); 
        Profile.create({pictureName: "", userId: newUser.id}).save(); 
        return newUser; 
   }

   @Mutation(() =>loginResponse)
   async login(
       @Arg('email') email: string,
       @Arg('password') password: string,
       @Ctx() {req, res}: MyContext
   ){
        const user = await User.findOne({where: {email: email.toLowerCase()}}); 
        if (!user) throw new AuthenticationError('Authentication failed. Invalid credentials'); 
        const isValid = await bcrypt.compare(password, user.password); 
        if(!isValid) throw new AuthenticationError('Authenctication failed. Invalid credentials'); 

        res.cookie('sif', getRefToken(user) ,{
                httpOnly: true,
                expires: new Date(Date.now() + 600480000)
            }
        );
        return getAuthToken(user);  
   }
}