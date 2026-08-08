import { InputVector, WorkloadPrediction, WorkloadLevel, RiskLevel, ConfidenceLevel, FusionConfig, EnsembleResult, Trend } from '../../types';
import { mamdaniInference } from './mamdani';
import { sugenoInference } from './sugeno';
import { neuralNetForward } from '../ml/neuralNet';
import { computeSHAP, generateRecommendations, generateActionItems } from '../ml/shap';

export const DEFAULT_FUSION: FusionConfig = {
  mamdaniWeight: 0.45,
  sugenoWeight: 0.30,
  nnWeight: 0.25,
  strategy: 'weighted_average',
  mlRefinement: true,
  adaptiveLearning: true,
};

function computeFusion(mamdaniScore: number, sugenoScore: number, nnScore: number, config: FusionConfig, mamdaniRules: number): { score: number; weights: number[] } {
  switch (config.strategy) {
    case 'weighted_average': {
      const w1 = config.mamdaniWeight, w2 = config.sugenoWeight, w3 = config.nnWeight;
      const sum = w1 + w2 + w3;
      return {
        score: (mamdaniScore * w1 + sugenoScore * w2 + nnScore * w3) / sum,
        weights: [w1/sum, w2/sum, w3/sum],
      };
    }
    case 'contextual_switch': {
      // Switch based on rule density: more rules → trust Mamdani; fewer → trust Sugeno+NN
      if (mamdaniRules > 7) {
        return { score: mamdaniScore * 0.55 + sugenoScore * 0.25 + nnScore * 0.20, weights: [0.55, 0.25, 0.20] };
      } else {
        return { score: mamdaniScore * 0.30 + sugenoScore * 0.40 + nnScore * 0.30, weights: [0.30, 0.40, 0.30] };
      }
    }
    case 'ensemble': {
      return { score: (mamdaniScore + sugenoScore + nnScore) / 3, weights: [0.333, 0.333, 0.334] };
    }
    case 'adaptive': {
      // Weighted by inverse variance (lower variance = higher trust)
      const mean = (mamdaniScore + sugenoScore + nnScore) / 3;
      const vars = [Math.abs(mamdaniScore - mean), Math.abs(sugenoScore - mean), Math.abs(nnScore - mean)];
      const inverses = vars.map(v => 1 / (v + 1));
      const sumInv = inverses.reduce((s, v) => s + v, 0);
      const weights = inverses.map(w => w / sumInv);
      return {
        score: mamdaniScore * weights[0] + sugenoScore * weights[1] + nnScore * weights[2],
        weights,
      };
    }
  }
}

function classifyLevel(s: number): WorkloadLevel {
  if (s >= 76) return 'Burnout Risk';
  if (s >= 51) return 'Overloaded';
  if (s >= 26) return 'Busy';
  return 'Normal';
}
function classifyRisk(s: number, t: Trend): RiskLevel {
  if (s >= 85 || (s >= 76 && t === 'worsening')) return 'critical';
  if (s >= 70 || (s >= 60 && t === 'worsening')) return 'high';
  if (s >= 45) return 'medium';
  return 'low';
}
function classifyConfidence(c: number): ConfidenceLevel {
  if (c >= 0.85) return 'high';
  if (c >= 0.70) return 'medium';
  return 'low';
}
function detectTrend(i: InputVector): Trend {
  if (i.historical.sevenDayTrend > 10) return 'worsening';
  if (i.historical.sevenDayTrend < -5) return 'improving';
  return 'stable';
}

export function hybridInference(inputs: InputVector, config: FusionConfig = DEFAULT_FUSION, memberId = 'unknown'): WorkloadPrediction {
  const mamdani = mamdaniInference(inputs);
  const sugeno = sugenoInference(inputs);
  const neuralNet = neuralNetForward(inputs);

  const fusion = computeFusion(mamdani.score, sugeno.score, neuralNet.score, config, mamdani.firedRules.length);
  const fusedScore = fusion.score;

  // Compute agreement between models
  const agreement = 1 - (Math.max(mamdani.score, sugeno.score, neuralNet.score) -
                        Math.min(mamdani.score, sugeno.score, neuralNet.score)) / 100;

  const baseConfidence = neuralNet.confidenceCalibration;
  const finalConfidence = Math.min(0.98, Math.max(0.5, baseConfidence * 0.6 + agreement * 0.4));

  const score = Math.max(0, Math.min(100, fusedScore));
  const trend = detectTrend(inputs);

  const ensemble: EnsembleResult = {
    finalScore: score,
    fuzzyScore: (mamdani.score + sugeno.score) / 2,
    nnScore: neuralNet.score,
    agreementScore: agreement,
    weightedConfidence: finalConfidence,
  };

  const shapValues = computeSHAP(inputs, score);
  const recommendations = generateRecommendations(inputs, score);
  const actionItems = generateActionItems(inputs, score);

  return {
    memberId,
    score,
    level: classifyLevel(score),
    confidence: finalConfidence * 100,
    confidenceLevel: classifyConfidence(finalConfidence),
    riskLevel: classifyRisk(score, trend),
    predictedTrend: trend,
    mamdani,
    sugeno,
    neuralNet,
    ensemble,
    shapValues,
    recommendations,
    actionItems,
    timestamp: new Date().toISOString(),
    fusionConfig: config,
  };
}
