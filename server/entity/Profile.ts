import {Entity, PrimaryGeneratedColumn, Column, OneToOne, BaseEntity, JoinColumn} from "typeorm";
import { ObjectType, Field, Int, ID} from "type-graphql";
import {User} from './User'; 

@ObjectType()
@Entity()
export class Profile extends BaseEntity{

    @Field(() => ID)
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
