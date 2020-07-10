import {ObjectType, Field, ID, Int, FieldResolver, Root} from 'type-graphql'; 
import { User } from '../../entity/User';
import { Post } from '../../entity/Post';

@ObjectType()
export class loginResponse {
    @Field(() => String)
    authToken: string
}

@ObjectType()
export class uploadResponse {
    @Field(() => String, {nullable: true})
    imgName?: string

    @Field(() => Boolean)
    uploaded: boolean
}


