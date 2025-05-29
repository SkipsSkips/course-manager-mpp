import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ActivityLog } from './activity-log.entity';
import { MonitoredUser } from './monitored-user.entity';

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @OneToMany(() => ActivityLog, (activityLog) => activityLog.user)
    activityLogs: ActivityLog[];

    @OneToMany(() => MonitoredUser, (monitoredUser) => monitoredUser.user)
    monitoredUsers: MonitoredUser[];
}