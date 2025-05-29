import { Request, Response } from 'express';
import { EntityService } from '../services/entity.service';
import { LogService } from '../services/log.service';

export class EntityController {
    private entityService: EntityService;
    private logService: LogService;

    constructor() {
        this.entityService = new EntityService();
        this.logService = new LogService();
    }

    public async createEntity(req: Request, res: Response): Promise<void> {
        try {
            const entityData = req.body;
            const newEntity = await this.entityService.create(entityData);
            await this.logService.logCreateAction(req.user.id, newEntity.id);
            res.status(201).json(newEntity);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    public async getEntity(req: Request, res: Response): Promise<void> {
        try {
            const entityId = req.params.id;
            const entity = await this.entityService.findById(entityId);
            if (!entity) {
                res.status(404).json({ message: 'Entity not found' });
                return;
            }
            res.status(200).json(entity);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    public async updateEntity(req: Request, res: Response): Promise<void> {
        try {
            const entityId = req.params.id;
            const entityData = req.body;
            const updatedEntity = await this.entityService.update(entityId, entityData);
            await this.logService.logUpdateAction(req.user.id, entityId);
            res.status(200).json(updatedEntity);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    public async deleteEntity(req: Request, res: Response): Promise<void> {
        try {
            const entityId = req.params.id;
            await this.entityService.delete(entityId);
            await this.logService.logDeleteAction(req.user.id, entityId);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    public async listEntities(req: Request, res: Response): Promise<void> {
        try {
            const { sort, filter } = req.query;
            const entities = await this.entityService.list(filter, sort);
            res.status(200).json(entities);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}