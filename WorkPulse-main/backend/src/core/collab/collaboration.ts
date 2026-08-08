import { TeamMember, Collaboration, CollaborationImpact } from '../../types';

/**
 * Computes collaboration impact for a member based on Brook's Law and
 * synergy/coordination overhead from active collaboration links.
 */
export function computeCollaborationImpact(memberId: string, team: TeamMember[], collaborations: Collaboration[]): CollaborationImpact {
  const memberCollabs = collaborations.filter(c => c.fromUserId === memberId || c.toUserId === memberId);

  if (memberCollabs.length === 0) {
    return {
      coordinationOverhead: 0,
      knowledgeTransferBenefit: 0,
      synergyFactor: 1.0,
      conflictPenalty: 0,
      netImpact: 0,
      brookesLawPaths: 0,
    };
  }

  const coordinationOverhead = memberCollabs.reduce((s, c) => s + c.coordinationOverhead, 0);
  const knowledgeTransferBenefit = memberCollabs.reduce((s, c) => s + c.knowledgeTransferScore, 0) / memberCollabs.length;
  const synergyFactor = memberCollabs.reduce((s, c) => s + c.synergyFactor, 0) / memberCollabs.length;
  const conflictPenalty = memberCollabs.reduce((s, c) => s + (c.intensity > 80 ? 2 : 0), 0);

  const teamSize = team.length;
  const brookesLawPaths = (teamSize * (teamSize - 1)) / 2;

  // Net impact: synergy reduces load, overhead+conflict add load
  const netImpact = -(knowledgeTransferBenefit * 0.5) + (coordinationOverhead * 0.2) + conflictPenalty - ((synergyFactor - 1.0) * 10);

  return {
    coordinationOverhead,
    knowledgeTransferBenefit,
    synergyFactor,
    conflictPenalty,
    netImpact: parseFloat(netImpact.toFixed(2)),
    brookesLawPaths,
  };
}

/**
 * Detects knowledge silos: members where bus factor is critical
 * AND they hold disproportionate domain knowledge.
 */
export function detectKnowledgeSilos(team: TeamMember[]): Array<{ memberId: string; risk: number; reason: string }> {
  return team
    .filter(m => m.inputs.team.busFactor < 2 || m.inputs.team.knowledgeSilos > 70)
    .map(m => ({
      memberId: m.id,
      risk: (10 - m.inputs.team.busFactor) * 8 + m.inputs.team.knowledgeSilos * 0.4,
      reason: m.inputs.team.busFactor < 2
        ? `Critical bus factor (${m.inputs.team.busFactor}) - knowledge concentrated in single member`
        : `High knowledge silos (${m.inputs.team.knowledgeSilos}%) - risk of information bottleneck`,
    }))
    .sort((a, b) => b.risk - a.risk);
}
