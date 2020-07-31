import { ObjectType, Field, Int, ID} from "type-graphql";

@ObjectType()
export class SenderPlusReceiverId {

    @Field(() => ID)
    id: number;

    @Field()
    username: string; 

    @Field()
    email: string; 

    @Field(() => String,{nullable: true})
    createdAt: Date; 

    @Field(() => Int)
    receiverId: number; 
}
