import { Router, Request, Response } from 'express';
import { state } from '../data/state';
import { hybridInference, DEFAULT_FUSION } from '../core/fuzzy/hybrid';
import { generateForecast } from '../core/forecast/lstm';
import { computeCollaborationImpact, detectKnowledgeSilos } from '../core/collab/collaboration';
import { ESCALATION_RULES } from '../core/alerts/escalation';
import { ROLES, hasPermission, getAllPermissions, USERS } from '../core/rbac/rbac';
import { RULE_BASE } from '../core/fuzzy/mamdani';
import { FusionConfig, InputVector, RoleId } from '../types';
import { authLimiter, predictLimiter } from '../middleware/rateLimit';
import { isRedisUp } from '../db/redis';

const router = Router();
const ok = (data: any) => ({ success: true, data });

router.get('/health', async (_req, res) => {
  res.json(ok({ status:'operational', version:'2.0.0', rules:RULE_BASE.length,
    uptime:process.uptime(), timestamp:new Date().toISOString(),
    cache:{ type:'redis', connected:isRedisUp() } }));
});

router.get('/team', authLimiter, async (_req, res) => { res.json(ok(await state.getTeam())); });
router.get('/team/:id', authLimiter, async (req, res) => {
  const m = await state.getMember(req.params.id);
  if (!m) return res.status(404).json({ success:false, error:'Member not found' });
  res.json(ok(m));
});
router.patch('/team/:id/inputs', authLimiter, async (req, res) => {
  const { inputs } = req.body as { inputs: InputVector };
  if (!inputs) return res.status(400).json({ success:false, error:'inputs required' });
  const updated = await state.updateMemberInputs(req.params.id, inputs);
  if (!updated) return res.status(404).json({ success:false, error:'Member not found' });
  await state.appendAudit({ userId:'u1', userName:'user', action:'PARAMS_UPDATED', resourceType:'member', resourceId:req.params.id, details:{}, level:'info', ipAddress:req.ip });
  res.json(ok({ member:updated, prediction:await state.getPrediction(req.params.id) }));
});

router.post('/predict/all', predictLimiter, async (_req, res) => { res.json(ok(await state.getPredictions())); });
router.post('/predict/custom', predictLimiter, async (req, res) => {
  const { inputs, fusionConfig, memberId } = req.body;
  if (!inputs) return res.status(400).json({ success:false, error:'inputs required' });
  const prediction = hybridInference(inputs, fusionConfig ?? await state.getFusionConfig(), memberId ?? 'custom');
  res.json(ok(prediction));
});
router.post('/predict/:id', predictLimiter, async (req, res) => {
  const m = await state.getMember(req.params.id);
  if (!m) return res.status(404).json({ success:false, error:'Member not found' });
  const config: FusionConfig = req.body.fusionConfig ?? await state.getFusionConfig();
  res.json(ok(hybridInference(m.inputs, config, m.id)));
});

router.get('/fusion/config', authLimiter, async (_req, res) => { res.json(ok(await state.getFusionConfig())); });
router.patch('/fusion/config', authLimiter, async (req, res) => {
  await state.setFusionConfig(req.body);
  await state.appendAudit({ userId:'u1', userName:'user', action:'FUSION_UPDATED', resourceType:'system', details:req.body, level:'info' });
  res.json(ok({ config:await state.getFusionConfig(), predictions:await state.getPredictions() }));
});

router.get('/fuzzy/rules', authLimiter, (_req, res) => {
  res.json(ok({ total:RULE_BASE.length, rules:RULE_BASE.map(r=>({ id:r.id, category:r.category, description:r.desc, weight:r.w, output:r.out })) }));
});
router.get('/fuzzy/rules/:category', authLimiter, (req, res) => {
  res.json(ok(RULE_BASE.filter(r => r.category === req.params.category)));
});

router.get('/forecasts', authLimiter, async (_req, res) => { res.json(ok(await state.getForecasts())); });
router.get('/forecasts/:id', authLimiter, async (req, res) => {
  const f = await state.getForecast(req.params.id);
  if (!f) return res.status(404).json({ success:false, error:'Forecast not found' });
  res.json(ok(f));
});
router.post('/forecasts/:id/regenerate', predictLimiter, async (req, res) => {
  const [m, pred] = await Promise.all([state.getMember(req.params.id), state.getPrediction(req.params.id)]);
  if (!m) return res.status(404).json({ success:false, error:'Member not found' });
  res.json(ok(generateForecast(req.params.id, m.inputs, pred?.score ?? 50, req.body.horizon ?? 7)));
});

router.get('/collaborations', authLimiter, (_req, res) => res.json(ok(state.getCollaborations())));
router.get('/collaborations/silos', authLimiter, async (_req, res) => {
  res.json(ok(detectKnowledgeSilos(await state.getTeam())));
});
router.get('/collaborations/:memberId/impact', authLimiter, async (req, res) => {
  res.json(ok(computeCollaborationImpact(req.params.memberId, await state.getTeam(), state.getCollaborations())));
});

router.get('/alerts', authLimiter, async (_req, res) => { res.json(ok(await state.getActiveAlerts())); });
router.get('/alerts/rules', (_req, res) => res.json(ok(ESCALATION_RULES)));
router.get('/rbac/roles', authLimiter, (_req, res) => res.json(ok(ROLES)));
router.get('/rbac/users', authLimiter, (_req, res) => res.json(ok(USERS)));
router.get('/rbac/permissions/:roleId', authLimiter, (req, res) => {
  res.json(ok({ roleId:req.params.roleId, permissions:getAllPermissions(req.params.roleId as RoleId) }));
});
router.get('/rbac/check/:roleId/:permission', authLimiter, (req, res) => {
  res.json(ok({ allowed:hasPermission(req.params.roleId as RoleId, req.params.permission as any) }));
});

router.get('/checkpoints', authLimiter, async (_req, res) => { res.json(ok(await state.getCheckpoints())); });
router.post('/checkpoints', authLimiter, async (req, res) => {
  const { label, description, type } = req.body;
  if (!label) return res.status(400).json({ success:false, error:'label required' });
  const [team, preds] = await Promise.all([state.getTeam(), state.getPredictions()]);
  const cp = await state.saveCheckpoint({ label, description, type:type??'manual', createdBy:'user', snapshot:{ team, predictions:preds } } as any);
  res.json(ok(cp));
});
router.post('/checkpoints/:id/restore', authLimiter, async (req, res) => {
  const cps = await state.getCheckpoints();
  const cp = cps.find((c: any) => c.id === req.params.id);
  if (!cp) return res.status(404).json({ success:false, error:'Checkpoint not found' });
  await state.restoreSnapshot((cp as any).snapshot.team, (cp as any).snapshot.predictions);
  res.json(ok({ restored:true }));
});
router.delete('/checkpoints/:id', authLimiter, async (req, res) => {
  const ok2 = await state.deleteCheckpoint(req.params.id);
  if (!ok2) return res.status(404).json({ success:false, error:'Checkpoint not found' });
  res.json(ok({ deleted:true }));
});

router.get('/audit', authLimiter, async (req, res) => {
  const limit = parseInt((req.query.limit as string) ?? '100');
  const events = await state.getAuditEvents(Math.min(limit, 500));
  res.json(ok({ events, total:events.length }));
});
router.get('/rate-limits', (_req, res) => res.json(ok(state.getRateLimits())));
router.get('/metrics/team', authLimiter, async (_req, res) => {
  const [team, preds] = await Promise.all([state.getTeam(), state.getPredictions()]);
  const scores = team.map(m => preds[m.id]?.score ?? 0);
  const avg = scores.reduce((s,v)=>s+v,0)/(scores.length||1);
  res.json(ok({
    avgScore: parseFloat(avg.toFixed(1)),
    burnoutCount: team.filter(m=>preds[m.id]?.level==='Burnout Risk').length,
    overloadedCount: team.filter(m=>preds[m.id]?.level==='Overloaded').length,
    teamSize: team.length,
    avgConfidence: parseFloat((team.reduce((s,m)=>s+(preds[m.id]?.confidence??0),0)/(team.length||1)).toFixed(2)),
    totalRulesFired: team.reduce((s,m)=>s+(preds[m.id]?.mamdani.firedRules.length??0),0),
    ruleBaseSize: RULE_BASE.length,
    timestamp: new Date().toISOString(),
  }));
});

export default router;
