import { getRepository, Repository } from 'typeorm';
import { Entity1 } from '../entities/entity1.entity';
import { Entity2 } from '../entities/entity2.entity';

export class EntityService {
    private entity1Repository: Repository<Entity1>;
    private entity2Repository: Repository<Entity2>;

    constructor() {
        this.entity1Repository = getRepository(Entity1);
        this.entity2Repository = getRepository(Entity2);
    }

    async createEntity1(data: Partial<Entity1>): Promise<Entity1> {
        const entity1 = this.entity1Repository.create(data);
        return await this.entity1Repository.save(entity1);
    }

    async getEntity1(id: number): Promise<Entity1 | undefined> {
        return await this.entity1Repository.findOne(id);
    }

    async updateEntity1(id: number, data: Partial<Entity1>): Promise<Entity1 | undefined> {
        await this.entity1Repository.update(id, data);
        return this.getEntity1(id);
    }

    async deleteEntity1(id: number): Promise<void> {
        await this.entity1Repository.delete(id);
    }

    async getAllEntity1s(): Promise<Entity1[]> {
        return await this.entity1Repository.find();
    }

    async createEntity2(data: Partial<Entity2>): Promise<Entity2> {
        const entity2 = this.entity2Repository.create(data);
        return await this.entity2Repository.save(entity2);
    }

    async getEntity2(id: number): Promise<Entity2 | undefined> {
        return await this.entity2Repository.findOne(id);
    }

    async updateEntity2(id: number, data: Partial<Entity2>): Promise<Entity2 | undefined> {
        await this.entity2Repository.update(id, data);
        return this.getEntity2(id);
    }

    async deleteEntity2(id: number): Promise<void> {
        await this.entity2Repository.delete(id);
    }

    async getAllEntity2s(): Promise<Entity2[]> {
        return await this.entity2Repository.find();
    }
}