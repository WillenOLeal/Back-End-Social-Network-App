import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, JoinColumn,  OneToOne, BaseEntity} from "typeorm";
import { ObjectType, Field, Int, ID} from "type-graphql";
import {Post} from './Post'; 
import {Profile} from './Profile'; 


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

    @Column({default: 0})
    tokenVersion: number

    @OneToMany(type => Post,  post => post.user, {cascade: true})
    posts: Post[];

    @OneToOne(type => Profile, {cascade: true})
    profile: Profile;

    @Field(() => String,{nullable: true})
    @CreateDateColumn({type: "timestamp"})
    createdAt: Date; 
}
