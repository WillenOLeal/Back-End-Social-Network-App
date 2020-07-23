import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,  ManyToOne, BaseEntity, PrimaryColumn, JoinColumn} from "typeorm";
import {User} from './User'; 

@Entity()
export class Friendship extends BaseEntity {
   
    @PrimaryColumn()
    senderId: number;
  
    @PrimaryColumn()
    receiverId: number;

    @ManyToOne(() => User, {primary: true, onDelete: 'CASCADE'})
    @JoinColumn({name: 'senderId'})
    sender: User; 

    @ManyToOne(() => User, {primary: true, onDelete: 'CASCADE'})
    @JoinColumn({name: 'receiverId'})
    receiver: User; 

    @Column()
    status: number; 

    @CreateDateColumn({type: "timestamp"})
    createdAt: Date;

}
