// utils/finance.ts

export function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface BlackScholesResult {
  callPrice: number;
  putPrice: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export function calculateBlackScholes(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number
): BlackScholesResult {
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const Nmd1 = normalCDF(-d1);
  const Nmd2 = normalCDF(-d2);
  const nd1 = normalPDF(d1);

  const callPrice = S * Nd1 - K * Math.exp(-r * T) * Nd2;
  const putPrice = K * Math.exp(-r * T) * Nmd2 - S * Nmd1;

  const delta = Nd1;
  const gamma = nd1 / (S * sigma * Math.sqrt(T));
  const theta = -(S * nd1 * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2;
  const vega = S * nd1 * Math.sqrt(T);
  const rho = K * T * Math.exp(-r * T) * Nd2;

  return { callPrice, putPrice, delta, gamma, theta: theta / 365, vega: vega / 100, rho: rho / 100 };
}