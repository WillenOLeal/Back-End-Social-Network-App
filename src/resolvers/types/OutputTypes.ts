import {ObjectType, Field, Int} from 'type-graphql'; 
import { Post } from '../../entity/Post';
import { Comment } from '../../entity/Comment';

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

@ObjectType()
export class getCommentsResponse {
    @Field(() => [Comment])
    comments: Comment[]; 

    @Field(() => Int)
    total: number; 
}

@ObjectType()
export class getPostsResponse {
    @Field(() => [Post])
    posts: Post[]; 

    @Field(() => Int)
    total: number; 
}






