import { IsEmail, MinLength, Max } from "class-validator";
import { Field, InputType, Int } from "type-graphql";

@InputType()
export class UserInput {
  @Field()
  @MinLength(4, {
    message: "The username is too short",
  })
  username: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6, {
    message: "The password is too short",
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
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  text?: string;

  @Field({ nullable: true })
  imgName?: string;
}

@InputType()
export class PaginationInput {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  @Max(30, {
    message: "The limit must be under 30",
  })
  limit: number;
}
