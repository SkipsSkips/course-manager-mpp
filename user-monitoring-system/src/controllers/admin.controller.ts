import { Request, Response } from 'express';
import { MonitoringService } from '../services/monitoring.service';

export class AdminController {
    private monitoringService: MonitoringService;

    constructor() {
        this.monitoringService = new MonitoringService();
    }

    public async getMonitoredUsers(req: Request, res: Response): Promise<Response> {
        try {
            const monitoredUsers = await this.monitoringService.getMonitoredUsers();
            return res.status(200).json(monitoredUsers);
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving monitored users', error });
        }
    }
}