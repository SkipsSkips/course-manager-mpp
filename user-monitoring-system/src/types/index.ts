export interface User {
    id: number;
    username: string;
    password: string;
    role: 'user' | 'admin';
}

export interface Entity1 {
    id: number;
    name: string;
    userId: number; // Foreign key to User
}

export interface Entity2 {
    id: number;
    description: string;
    entity1Id: number; // Foreign key to Entity1
}

export interface ActivityLog {
    id: number;
    userId: number; // Foreign key to User
    action: string;
    timestamp: Date;
}

export interface MonitoredUser {
    id: number;
    userId: number; // Foreign key to User
    reason: string;
    monitoredSince: Date;
}