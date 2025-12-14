import { calculateBlackScholes } from './finance';

describe('Black-Scholes Model Logic', () => {
  
  // Benchmark Data: S=100, K=100, T=1, r=0.05, sigma=0.2
  const S = 100;
  const K = 100;
  const T = 1;
  const r = 0.05;
  const sigma = 0.2;

  test('Calculates Call Price correctly within 4 decimal places', () => {
    // We move the calculation INSIDE the test
    const result = calculateBlackScholes(S, K, T, r, sigma);
    // We expect 10.45058...
    expect(result.callPrice).toBeCloseTo(10.4506, 3); 
  });

  test('Calculates Put Price correctly within 4 decimal places', () => {
    const result = calculateBlackScholes(S, K, T, r, sigma);
    // We expect 5.57352...
    expect(result.putPrice).toBeCloseTo(5.5735, 3);
  });

  test('Verifies Put-Call Parity (Financial Consistency Check)', () => {
    const result = calculateBlackScholes(S, K, T, r, sigma);
    
    // Theory: Call - Put = S - K * e^(-rT)
    const lhs = result.callPrice - result.putPrice;
    const rhs = S - (K * Math.exp(-r * T));
    
    expect(lhs).toBeCloseTo(rhs, 5); 
  });

  test('Deep OTM Call should be near zero', () => {
    // If Stock is $10 and Strike is $1000, Call should be 0
    const otm = calculateBlackScholes(10, 1000, 1, 0.05, 0.2);
    expect(otm.callPrice).toBeCloseTo(0, 2);
  });
});