import { ObjectType, Field, Int} from "type-graphql";

@ObjectType()
export class SenderPlusReceiverId {

    @Field(() => Int)
    id: number;

    @Field()
    username: string; 

    @Field()
    email: string; 

    @Field(() => Int)
    receiverId: number; 

    @Field(() => String,{nullable: true})
    createdAt: Date; 
    
}
