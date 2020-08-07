import {Entity, PrimaryGeneratedColumn, Column, OneToOne, BaseEntity, JoinColumn} from "typeorm";
import { ObjectType, Field, Int} from "type-graphql";
import {User} from './User'; 

@ObjectType()
@Entity()
export class Profile extends BaseEntity{

    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(() => Int)
    @Column()
    pictureName: string;

    @Field(() => Int)
    @Column()
    userId: number; 
    
    @OneToOne(type => User, {onDelete: 'CASCADE'}) 
    @JoinColumn()
    user: User;
}
