import { Checkpoint, TeamMember, WorkloadPrediction } from '../../types';
import { v4 as uuid } from 'uuid';

class CheckpointStore {
  private checkpoints: Checkpoint[] = [];
  private maxAuto = 10;
  private maxManual = 50;

  create(label: string, description: string | undefined, type: 'manual' | 'auto' | 'incremental', createdBy: string, team: TeamMember[], predictions: Record<string, WorkloadPrediction>): Checkpoint {
    const snapshot = JSON.parse(JSON.stringify({ team, predictions }));
    const cp: Checkpoint = {
      id: uuid(), label, description, type, createdBy,
      timestamp: new Date().toISOString(),
      snapshot,
      size: JSON.stringify(snapshot).length,
    };
    this.checkpoints.unshift(cp);

    // Rotation: keep maxManual manual + maxAuto auto
    const manual = this.checkpoints.filter(c => c.type === 'manual').slice(0, this.maxManual);
    const auto = this.checkpoints.filter(c => c.type === 'auto').slice(0, this.maxAuto);
    const incremental = this.checkpoints.filter(c => c.type === 'incremental').slice(0, 100);
    this.checkpoints = [...manual, ...auto, ...incremental].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return cp;
  }

  getAll(): Checkpoint[] { return this.checkpoints; }
  getById(id: string): Checkpoint | undefined { return this.checkpoints.find(c => c.id === id); }
  delete(id: string): boolean {
    const idx = this.checkpoints.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.checkpoints.splice(idx, 1);
    return true;
  }
  restore(id: string): { team: TeamMember[]; predictions: Record<string, WorkloadPrediction> } | null {
    const cp = this.getById(id);
    return cp ? cp.snapshot : null;
  }
}

export const checkpointStore = new CheckpointStore();
