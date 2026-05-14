import prisma from '../../config/database.js';

export interface AuditLogParams {
  tableName: string;
  recordId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  performedById: string;
}

export class AuditService {
  /**
   * Logs a database operation.
   * Business Rule: For updates, diff old vs new values and store only changes.
   */
  async log(params: AuditLogParams): Promise<void> {
    let finalOldValues = params.oldValues;
    let finalNewValues = params.newValues;

    if (params.action === 'UPDATE' && params.oldValues && params.newValues) {
      const diff = this.getDiff(params.oldValues, params.newValues);
      finalOldValues = diff.old;
      finalNewValues = diff.new;
      
      // If no changes, don't log
      if (Object.keys(finalNewValues).length === 0) return;
    }

    await prisma.auditLog.create({
      data: {
        tableName: params.tableName,
        recordId: params.recordId,
        action: params.action,
        oldValues: finalOldValues as any,
        newValues: finalNewValues as any,
        performedById: params.performedById,
      },
    });
  }

  /**
   * Helper to diff two objects.
   */
  private getDiff(oldObj: Record<string, any>, newObj: Record<string, any>) {
    const oldDiff: Record<string, any> = {};
    const newDiff: Record<string, any> = {};

    for (const key in newObj) {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        oldDiff[key] = oldObj[key];
        newDiff[key] = newObj[key];
      }
    }

    return { old: oldDiff, new: newDiff };
  }
}

export const auditService = new AuditService();
