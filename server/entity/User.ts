import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, JoinColumn,  OneToOne, BaseEntity} from "typeorm";
import { ObjectType, Field, Int, ID} from "type-graphql";
import {Post} from './Post'; 
import {Profile} from './Profile'; 
import { Comment } from "./Comment";


@ObjectType()
@Entity()
export class User extends BaseEntity{

    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    username: string; 

    @Field()
    @Column()
    email: string; 

    @Column()
    password: string; 

    @Column({default: false})
    emailConfirmed: boolean

    @Column({default: 0})
    tokenVersion: number

    @OneToMany(type => Post,  post => post.user, {cascade: true})
    posts: Post[];

    @OneToMany(type => Comment,  Comment => Comment.user, {cascade: true})
    comments: Comment[];

    @OneToOne(type => Profile, {cascade: true})
    profile: Profile;

    @Field(() => String,{nullable: true})
    @CreateDateColumn({type: "timestamp"})
    createdAt: Date; 
}
