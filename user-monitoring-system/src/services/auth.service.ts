import { User } from '../entities/user.entity';
import { getRepository } from 'typeorm';
import bcrypt from 'bcrypt';

export class AuthService {
    private userRepository = getRepository(User);

    async register(username: string, password: string): Promise<User> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({ username, password: hashedPassword, role: 'regular' });
        return await this.userRepository.save(user);
    }

    async login(username: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { username } });
        if (user && await bcrypt.compare(password, user.password)) {
            return user;
        }
        return null;
    }

    async getUserById(id: number): Promise<User | undefined> {
        return await this.userRepository.findOne(id);
    }

    async updateUser(id: number, username: string, password?: string): Promise<User | undefined> {
        const user = await this.userRepository.findOne(id);
        if (user) {
            user.username = username;
            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }
            return await this.userRepository.save(user);
        }
        return undefined;
    }

    async deleteUser(id: number): Promise<void> {
        await this.userRepository.delete(id);
    }
}