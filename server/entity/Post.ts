import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne} from "typeorm";
import { ObjectType, Field, Int, ID } from "type-graphql";
import {User} from './User'; 

@ObjectType()
@Entity()
export class Post extends BaseEntity {

    @Field(() => ID)
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
    imgUrl: string; 

    @Field(() => Int)
    @Column()
    userId: number; 

    @ManyToOne(type => User, user => user.posts, { onDelete: 'CASCADE' })
    user:  User

    @Field(() => String)
    @CreateDateColumn({type: "timestamp"})
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn({type: "timestamp"})
    updatedAt: Date; 

}
