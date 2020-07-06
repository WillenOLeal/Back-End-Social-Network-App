import {ObjectType, Field} from 'type-graphql'; 

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

