import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable,  ManyToOne, BaseEntity} from "typeorm";
import { ObjectType, Field, Int, ID} from "type-graphql";
import {Post} from './Post'; 
import {User} from './User'; 


@ObjectType()
@Entity()
export class Comment extends BaseEntity{

    @Field(() => ID, {nullable: true})
    @PrimaryGeneratedColumn()
    id?: number;

    @Field({nullable: true})
    @Column()
    text?: string;

    @Field(() => Int, {nullable: true})
    @Column()
    userId?: number; 

    @Field(() => User)
    @ManyToOne(type => User, user => user.comments, { onDelete: 'CASCADE' })
    user?:  User

    @Field(() => Int, {nullable: true})
    @Column()
    postId?: number; 

    @ManyToOne(type => Post, post => post.comments, { onDelete: 'CASCADE' })
    post?:  Post

    @ManyToMany(type => User, {cascade: true, onDelete: "CASCADE"})
    @JoinTable({name: "likedComment"})
    likes: User[];

    @Field(() => Int, {nullable: true})
    likesCount?: number; 

    @Field(() => String, {nullable: true})
    @CreateDateColumn({type: "timestamp"})
    createdAt?: Date; 

}
