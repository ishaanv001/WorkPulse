import { ForecastPoint, ForecastResult, InputVector } from '../../types';
import { hybridInference, DEFAULT_FUSION } from '../fuzzy/hybrid';

// Seeded RNG for reproducible forecasts
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Simulates an LSTM time-series prediction with confidence intervals.
 * In production this would call a real ML model; here we simulate the dynamics.
 */
export function generateForecast(memberId: string, inputs: InputVector, currentScore: number, horizon: number = 7): ForecastResult {
  const rng = seededRandom(memberId.charCodeAt(0) * 31 + Math.floor(currentScore));
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon+', 'Tue+', 'Wed+', 'Thu+', 'Fri+'];

  const trendFactor = inputs.historical.sevenDayTrend / 50;
  const variance = inputs.historical.velocityVariance / 100;
  const stressFactor = (inputs.wellbeing.selfReportedStress - 5) / 5;
  const sleepFactor = (5 - inputs.wellbeing.sleepQuality) / 5;

  const points: ForecastPoint[] = [];
  let runningScore = currentScore;
  let lstmTotal = 0, arimaTotal = 0, mae = 0, rmse = 0;

  for (let i = 0; i < horizon; i++) {
    // LSTM contribution: trend-aware, recurrent
    const lstmDrift = trendFactor * 3 + stressFactor * 2 + sleepFactor * 1.5;
    const noise = (rng() - 0.5) * 4 * (1 + variance);
    const lstmScore = Math.max(0, Math.min(100, runningScore + lstmDrift * (i+1) * 0.3 + noise));

    // ARIMA contribution: regression to mean
    const meanReversion = (50 - currentScore) * 0.05 * (i + 1);
    const arimaScore = Math.max(0, Math.min(100, currentScore + meanReversion + (rng() - 0.5) * 3));

    // Ensemble: weighted average
    const ensembleScore = lstmScore * 0.65 + arimaScore * 0.35;
    runningScore = ensembleScore;

    const ci = 3 + i * 1.4 + variance * 4;
    const confidence = Math.max(0.5, 0.95 - i * 0.05);

    points.push({
      date: days[i] ?? `+${i}`,
      score: parseFloat(ensembleScore.toFixed(1)),
      confidence,
      lower: Math.max(0, ensembleScore - ci),
      upper: Math.min(100, ensembleScore + ci),
      modelContributions: {
        lstm: parseFloat(lstmScore.toFixed(1)),
        arima: parseFloat(arimaScore.toFixed(1)),
        ensemble: parseFloat(ensembleScore.toFixed(1)),
      },
    });

    lstmTotal += lstmScore;
    arimaTotal += arimaScore;
    mae += Math.abs(lstmScore - arimaScore);
    rmse += Math.pow(lstmScore - arimaScore, 2);
  }

  return {
    memberId,
    points,
    horizon,
    model: 'LSTM + ARIMA Ensemble',
    mae: parseFloat((mae / horizon).toFixed(2)),
    rmse: parseFloat(Math.sqrt(rmse / horizon).toFixed(2)),
  };
}
