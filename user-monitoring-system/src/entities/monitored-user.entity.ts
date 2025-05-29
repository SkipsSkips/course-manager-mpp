import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class MonitoredUser {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    suspiciousActivityCount: number;

    @Column()
    lastActivityTimestamp: Date;
}