import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Entity1 } from './entity1.entity';

@Entity()
export class Entity2 {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(() => User, user => user.entity2s)
    user: User;

    @ManyToOne(() => Entity1, entity1 => entity1.entity2s)
    entity1: Entity1;
}