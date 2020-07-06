import { IsEmail, MinLength} from 'class-validator';
import {Field, InputType} from'type-graphql'; 


@InputType()
export class UserInput {
    @Field()
    @IsEmail()
    email: string;

    @Field()
    @MinLength(6, {
        message: "The password is too short"
    })
    password: string;
}


@InputType()
export class PostInput {
    @Field()
    title: string;

    @Field()
    text: string;

    @Field()
    imgName: string; 
}



@InputType()
export class PostUpdateInput {
    @Field({nullable: true})
    title?: string;

    @Field({nullable: true})
    text?: string;

    @Field({nullable: true})
    imgName?: string; 
}