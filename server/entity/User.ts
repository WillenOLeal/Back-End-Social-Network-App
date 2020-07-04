import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity} from "typeorm";
import { ObjectType, Field, Int, ID} from "type-graphql";
import {Post} from './Post'; 


@ObjectType()
@Entity()
export class User extends BaseEntity{

    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    email: string; 

    @Column()
    password: string; 

    @OneToMany(type => Post,  post => post.user, {cascade: true})
    posts: Post[];

    @Field(() => String,{nullable: true})
    @CreateDateColumn({type: "timestamp"})
    createdAt: Date; 
}
