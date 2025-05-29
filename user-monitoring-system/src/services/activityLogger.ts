import { ActivityLog } from '../config/database';
import { Request } from 'express';

export interface LogActivityParams {
  userId: number;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entity: string;
  entityId?: number;
  details?: object;
  req?: Request;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { userId, action, entity, entityId, details, req } = params;
    
    await ActivityLog.create({
      userId,
      action,
      entity,
      entityId,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent')
    });
    
    console.log(`Activity logged: User ${userId} performed ${action} on ${entity}${entityId ? ` (ID: ${entityId})` : ''}`);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export function createActivityMiddleware(entity: string, action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE') {
  return (req: any, res: any, next: any) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        let entityId = req.params.id ? parseInt(req.params.id) : undefined;
        
        // For CREATE operations, try to extract ID from response
        if (action === 'CREATE' && data) {
          try {
            const responseData = typeof data === 'string' ? JSON.parse(data) : data;
            entityId = responseData.id;
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        logActivity({
          userId: req.user.id,
          action,
          entity,
          entityId,
          details: {
            endpoint: req.path,
            method: req.method,
            query: req.query,
            body: action !== 'READ' ? req.body : undefined
          },
          req
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}
