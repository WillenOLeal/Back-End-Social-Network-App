import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, 
    ManyToMany, OneToMany, JoinTable} from "typeorm";
import { ObjectType, Field, Int} from "type-graphql";
import {User} from './User'; 
import { Comment } from "./Comment";

@ObjectType()
@Entity()
export class Post extends BaseEntity {

    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    title: string;

    @Field()
    @Column()
    text: string;

    @Field()
    @Column()
    imgName: string; 

    @Field(() => Int)
    @Column()
    userId: number; 

    @Field(() => User)
    @ManyToOne(type => User, user => user.posts, { onDelete: 'CASCADE' })
    user:  User; 

    @OneToMany(type => Comment,  comment => comment.post, {cascade: true})
    comments: Comment[];

    @ManyToMany(type => User, {cascade: true, onDelete: "CASCADE"})
    @JoinTable({name: "likedPost"})
    likes: User[];

    @Field(() => Int)
    likesCount: number; 

    @Field(() => Boolean)
    hasLiked: boolean; 

    @Field(() => String)
    @CreateDateColumn({type: "timestamp"})
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn({type: "timestamp"})
    updatedAt: Date; 

}
