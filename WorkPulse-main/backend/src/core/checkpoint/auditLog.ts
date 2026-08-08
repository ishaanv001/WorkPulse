import { AuditEvent } from '../../types';
import { v4 as uuid } from 'uuid';

class AuditLogStore {
  private events: AuditEvent[] = [];
  private maxEvents = 10000;

  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const ev: AuditEvent = {
      ...event,
      id: uuid(),
      timestamp: new Date().toISOString(),
    };
    this.events.unshift(ev);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
    return ev;
  }

  query(filters: { userId?: string; action?: string; level?: string; limit?: number } = {}): AuditEvent[] {
    let results = this.events;
    if (filters.userId) results = results.filter(e => e.userId === filters.userId);
    if (filters.action) results = results.filter(e => e.action === filters.action);
    if (filters.level) results = results.filter(e => e.level === filters.level);
    return results.slice(0, filters.limit ?? 100);
  }

  getAll(): AuditEvent[] { return this.events; }
  getCount(): number { return this.events.length; }
}

export const auditLog = new AuditLogStore();

// Seed with realistic events
function seedAuditLog() {
  const events = [
    { userId:'u1', userName:'sarah.miller', action:'PREDICTION_RUN',     resourceType:'team',     details:{strategy:'weighted_average',confidence:91},                  level:'info' as const },
    { userId:'u1', userName:'sarah.miller', action:'CHECKPOINT_SAVED',   resourceType:'snapshot', details:{label:'Sprint14-EOD',members:5},                              level:'info' as const },
    { userId:'sys',userName:'system',       action:'ALERT_TRIGGERED',    resourceType:'alert',    details:{type:'burnout_risk',target:'alex.chen',score:89.3},          level:'warning' as const },
    { userId:'u1', userName:'sarah.miller', action:'PARAMS_UPDATED',     resourceType:'member',   details:{member:'alex.chen',changes:'activeTasks:12->14'},            level:'info' as const },
    { userId:'u3', userName:'raj.joshi',    action:'LOGIN',              resourceType:'session',  details:{role:'member',ip:'192.168.1.45'},                            level:'info' as const },
    { userId:'sys',userName:'system',       action:'BACKUP_INCREMENTAL', resourceType:'system',   details:{entities:5,sizeKB:2.3,checksum:'a4f2c8'},                    level:'info' as const },
    { userId:'u1', userName:'sarah.miller', action:'RBAC_VIEWED',        resourceType:'rbac',     details:{view:'permission_matrix',role:'manager'},                    level:'info' as const },
    { userId:'sys',userName:'system',       action:'PREDICTION_BATCH',   resourceType:'team',     details:{members:5,avgScore:68.4,durationMs:12},                      level:'info' as const },
    { userId:'u2', userName:'david.chen',   action:'RBAC_MODIFIED',      resourceType:'rbac',     details:{role:'manager',permission:'analytics:view:predictive'},      level:'critical' as const },
    { userId:'u1', userName:'sarah.miller', action:'EXPORT_REPORT',      resourceType:'report',   details:{format:'PDF',sprint:14},                                     level:'info' as const },
    { userId:'sys',userName:'system',       action:'ML_RETRAIN',         resourceType:'model',    details:{accuracy:91.2,deltaAccuracy:'+0.4'},                         level:'info' as const },
    { userId:'sys',userName:'system',       action:'RATE_LIMIT_HIT',     resourceType:'api',      details:{tier:'AI Predictions',user:'u3'},                            level:'warning' as const },
  ];
  events.forEach(e => auditLog.log(e));
}
seedAuditLog();
