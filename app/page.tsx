"use client";

import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Activity, Plus, Trash2, TrendingDown, BarChart3, Search, Loader2, AlertTriangle, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { calculateBlackScholes } from '../utils/finance';

// ============================================================================
// LOGIC ENGINES
// ============================================================================

function generateGaussianRandom(): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function simulateGBMPath(S0: number, r: number, sigma: number, T: number, steps: number): number[] {
  const dt = T / steps;
  const path = new Array(steps + 1);
  path[0] = S0;

  for (let i = 1; i <= steps; i++) {
    const Z = generateGaussianRandom();
    const drift = (r - 0.5 * sigma * sigma) * dt;
    const diffusion = sigma * Math.sqrt(dt) * Z;
    path[i] = path[i - 1] * Math.exp(drift + diffusion);
  }

  return path;
}

// ============================================================================
// TYPES & PALETTE
// ============================================================================

interface Asset {
  id: string;
  name: string;
  currentValue: number;
  targetAllocation: number;
}

const COLORS = ['#e11d48', '#10b981', '#64748b', '#d8b4fe', '#f59e0b', '#6366f1', '#14b8a6'];

// ============================================================================
// COMPONENTS
// ============================================================================

const GlassCard = ({ children, className = "" }: any) => (
  <div className={`relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
    <div className="relative z-10 p-6 md:p-8">{children}</div>
  </div>
);

const SliderInput = ({ label, value, onChange, min, max, step, unit = '' }: any) => {
  const isPrefix = unit === '$';
  return (
    <div className="group mb-6">
      <div className="flex justify-between items-end mb-3">
        <label className="text-[10px] uppercase tracking-[0.15em] text-stone-400 font-bold">{label}</label>
        <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm focus-within:border-rose-300 transition-colors">
          {isPrefix && <span className="text-stone-400 font-mono text-xs mr-1">{unit}</span>}
          <input
            type="number"
            value={typeof value === 'number' ? Number(value.toFixed(4)) : value}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onChange(val);
            }}
            step={step}
            className="bg-transparent text-stone-700 font-mono text-sm w-20 text-right focus:outline-none appearance-none"
          />
          {!isPrefix && unit && <span className="text-stone-400 font-mono text-xs ml-1">{unit}</span>}
        </div>
      </div>
      <div className="relative h-4 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-[2px] bg-stone-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-[0_2px_5px_rgba(225,29,72,0.2)] transition-all hover:[&::-webkit-slider-thumb]:scale-110"
        />
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, type = 'neutral' }: any) => {
  const styles = {
    positive: 'bg-emerald-50/50 border-emerald-100 text-emerald-800',
    negative: 'bg-rose-50/50 border-rose-100 text-rose-800',
    neutral: 'bg-stone-50/50 border-stone-100 text-stone-600',
  };
  const activeStyle = type === 'positive' ? styles.positive : type === 'negative' ? styles.negative : styles.neutral;
  const iconColor = type === 'positive' ? 'text-emerald-400' : type === 'negative' ? 'text-rose-400' : 'text-stone-400';

  return (
    <div className={`relative overflow-hidden ${activeStyle} border backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between h-32 group transition-all duration-500 hover:shadow-lg hover:bg-opacity-80`}>
      <div className="flex justify-between items-start">
        <span className="text-[10px] uppercase tracking-[0.2em] opacity-60 font-bold">{title}</span>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="text-3xl font-light tracking-tight">
        ${value.toFixed(2)}
      </div>
    </div>
  );
};

const GreekCard = ({ name, value, description }: any) => (
  <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-center mb-2">
      <span className="text-xs font-semibold text-stone-400">{name}</span>
    </div>
    <div className="text-lg font-normal text-stone-700">{value.toFixed(4)}</div>
    <div className="text-[9px] uppercase tracking-wider text-stone-300 mt-1">{description}</div>
  </div>
);

const TickerSearch = ({ ticker, setTicker, handleStockSearch, isFetchingPrice, priceError }: any) => (
  <div className="mb-8 relative z-20">
    <div className="flex gap-0 backdrop-blur-xl bg-white/80 border border-stone-200 rounded-full p-1 pl-5 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-50 transition-all shadow-sm max-w-md mx-auto lg:mx-0">
      <Search className="text-stone-400 my-auto" size={16} />
      <input
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && handleStockSearch()}
        placeholder="ENTER TICKER..."
        className="w-full bg-transparent border-none text-stone-700 placeholder:text-stone-300 text-sm px-3 py-2 focus:outline-none focus:ring-0 font-mono tracking-wider"
      />
      <button
        onClick={handleStockSearch}
        disabled={isFetchingPrice || !ticker}
        className="bg-stone-900 hover:bg-stone-800 text-white px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold tracking-widest uppercase shadow-md hover:shadow-lg"
      >
        {isFetchingPrice ? <Loader2 className="animate-spin" size={14} /> : 'Fetch'}
      </button>
    </div>
    {priceError && <p className="text-xs text-rose-500 mt-2 ml-4 flex items-center gap-1 font-mono">{priceError}</p>}
  </div>
);

const TAB_INFO = {
    derivatives: {
      title: "Model: Black-Scholes-Merton",
      text: "Calculates the theoretical fair value of options assuming constant volatility and risk-free rates. Essential for understanding price sensitivity via Greeks."
    },
    montecarlo: {
      title: "Model: Stochastic Simulation",
      text: "Uses Geometric Brownian Motion to simulate thousands of future price paths, estimating Value at Risk (VaR) and ITM probability under uncertainty."
    },
    allocation: {
      title: "Strategy: Portfolio Balance",
      text: "Analyzes current holdings against target percentages to generate precise buy/sell rebalancing orders, maintaining your desired risk profile."
    }
  };
  
const InfoSection = ({ activeTab }: { activeTab: string }) => {
    const content = TAB_INFO[activeTab as keyof typeof TAB_INFO];
    if (!content) return null;
  
    return (
      <div key={activeTab} className="mt-12 pt-8 border-t border-stone-200 animate-in fade-in slide-in-from-bottom-2 duration-700">
         <div className="bg-white border border-stone-100 rounded-3xl p-8 relative overflow-hidden group shadow-sm">
           <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-gradient-to-bl from-rose-50 to-transparent rounded-full blur-3xl pointer-events-none" />
           <div className="relative z-10">
             <h3 className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-rose-500 font-bold mb-4">
               <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
               {content.title}
             </h3>
             <p className="text-sm font-light leading-relaxed text-stone-500 max-w-4xl">
               {content.text}
             </p>
           </div>
         </div>
      </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState<'derivatives' | 'montecarlo' | 'allocation'>('derivatives');

  // STATE
  const [ticker, setTicker] = useState('');
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');

  const [S, setS] = useState(100);
  const [K, setK] = useState(100);
  const [T, setT] = useState(1);
  const [r, setR] = useState(5);
  const [sigma, setSigma] = useState(20);

  const [mcParams, setMcParams] = useState({
    S0: 100, K: 100, T: 1, r: 0.05, sigma: 0.2, iterations: 2000, steps: 50, optionType: 'call' as 'call' | 'put'
  });
  const [mcResults, setMcResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [assets, setAssets] = useState<Asset[]>([
    { id: '1', name: 'US Stocks', currentValue: 50000, targetAllocation: 40 },
    { id: '2', name: 'Bonds', currentValue: 30000, targetAllocation: 30 },
    { id: '3', name: 'International', currentValue: 20000, targetAllocation: 30 },
  ]);

  // HANDLERS
  const handleStockSearch = async () => {
    if (!ticker) return;
    setIsFetchingPrice(true);
    setPriceError('');
    try {
      const API_KEY = 'FYYX9SDAG15X3QIM'; 
      const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`);
      const data = await response.json();
      if (data['Note'] || data['Information']) throw new Error("API Limit");
      const priceString = data['Global Quote']?.['05. price'];
      if (!priceString) throw new Error("Not found");
      const price = parseFloat(priceString);
      if (activeTab === 'derivatives') { setS(price); setK(price); }
      else if (activeTab === 'montecarlo') { setMcParams(prev => ({ ...prev, S0: price, K: price })); }
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const result = useMemo(() => calculateBlackScholes(S, K, T, r / 100, sigma / 100), [S, K, T, r, sigma]);

  const chartData = useMemo(() => {
    const data = [];
    const minS = S * 0.5;
    const maxS = S * 1.5;
    const step = (maxS - minS) / 50;
    for (let price = minS; price <= maxS; price += step) {
      const bs = calculateBlackScholes(price, K, T, r / 100, sigma / 100);
      data.push({ price: price.toFixed(2), call: bs.callPrice.toFixed(2), put: bs.putPrice.toFixed(2) });
    }
    return data;
  }, [S, K, T, r, sigma]);

  const runMonteCarloSimulation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const { S0, K, T, r, sigma, iterations, steps, optionType } = mcParams;
      const allPaths: number[][] = [];
      const payoffs: number[] = [];
      let sumPayoff = 0, sumPayoffSquared = 0, inTheMoneyCount = 0;

      for (let i = 0; i < iterations; i++) {
        const path = simulateGBMPath(S0, r, sigma, T, steps);
        allPaths.push(path);
        const ST = path[path.length - 1];
        const payoff = optionType === 'call' ? Math.max(ST - K, 0) : Math.max(K - ST, 0);
        if (payoff > 0) inTheMoneyCount++;
        const discounted = payoff * Math.exp(-r * T);
        payoffs.push(discounted);
        sumPayoff += discounted;
        sumPayoffSquared += discounted * discounted;
      }

      const optionPrice = sumPayoff / iterations;
      const variance = (sumPayoffSquared / iterations) - (optionPrice * optionPrice);
      const standardError = Math.sqrt(variance / iterations);
      payoffs.sort((a, b) => a - b);
      const valueAtRisk = optionPrice - payoffs[Math.floor(iterations * 0.05)];
      
      const visualPaths = [];
      const step = Math.max(1, Math.floor(iterations / 20));
      for (let i = 0; i < iterations; i += step) if (visualPaths.length < 20) visualPaths.push(allPaths[i]);

      setMcResults({ optionPrice, standardError, inTheMoneyProbability: (inTheMoneyCount / iterations) * 100, valueAtRisk, visualPaths });
      setIsCalculating(false);
    }, 50);
  };

  const mcChartData = useMemo(() => {
    if (!mcResults) return [];
    const data: any[] = [];
    const steps = mcResults.visualPaths[0]?.length || 0;
    for (let step = 0; step < steps; step++) {
      const point: any = { step };
      mcResults.visualPaths.forEach((path: number[], idx: number) => { point[`path${idx}`] = path[step]; });
      data.push(point);
    }
    return data;
  }, [mcResults]);

  const calculations = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
    const totalAllocation = assets.reduce((sum, a) => sum + (a.targetAllocation || 0), 0);
    const actions = assets.map(asset => {
      const targetValue = (totalValue * (asset.targetAllocation || 0)) / 100;
      const delta = targetValue - (asset.currentValue || 0);
      return { ...asset, targetValue, delta, action: delta > 0.01 ? 'BUY' : delta < -0.01 ? 'SELL' : 'HOLD' };
    });
    return { 
      totalValue, 
      totalAllocation, 
      isValid: Math.abs(totalAllocation - 100) < 0.01, 
      actionableItems: actions.filter(a => a.action !== 'HOLD'),
      currentData: assets.filter(a => a.currentValue > 0).map(a => ({ name: a.name || 'Unnamed', value: a.currentValue })),
      targetData: assets.filter(a => a.targetAllocation > 0).map(a => ({ name: a.name || 'Unnamed', value: (totalValue * a.targetAllocation) / 100 }))
    };
  }, [assets]);

  const addAsset = () => setAssets([...assets, { id: Date.now().toString(), name: '', currentValue: 0, targetAllocation: 0 }]);
  const removeAsset = (id: string) => setAssets(assets.filter(a => a.id !== id));
  const updateAsset = (id: string, field: keyof Asset, value: string | number) => setAssets(assets.map(a => (a.id === id ? { ...a, [field]: value } : a)));

  return (
    <main className="min-h-screen relative overflow-x-hidden selection:bg-rose-200 selection:text-rose-900">
      <div className="fixed inset-0 -z-10 pointer-events-none bg-[#fdfdfc]">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-rose-100/40 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] bg-stone-100/60 rounded-full blur-[80px]" />
      </div>

      <nav className="border-b border-stone-100 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center shadow-lg">
                <Sparkles size={16} className="text-white fill-white" />
             </div>
             <div>
               <h1 className="text-lg font-normal tracking-tight text-stone-800">Clara</h1>
             </div>
          </div>
          <div className="flex bg-stone-100/80 p-1 rounded-full border border-stone-200/50">
            {[
              { id: 'derivatives', icon: BarChart3, label: 'Valuation' },
              { id: 'montecarlo', icon: Activity, label: 'Simulation' },
              { id: 'allocation', icon: Layers, label: 'Allocation' }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${activeTab === tab.id ? 'bg-white text-stone-800 shadow-sm border border-stone-100' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 border border-transparent'}`}>
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-6 md:p-10">
        {activeTab === 'derivatives' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-4">
               <GlassCard className="h-full">
                  <TickerSearch ticker={ticker} setTicker={setTicker} handleStockSearch={handleStockSearch} isFetchingPrice={isFetchingPrice} priceError={priceError} />
                  <div className="flex items-center gap-2 mb-8 border-b border-stone-100 pb-4">
                    <Activity className="w-4 h-4 text-rose-400" />
                    <h2 className="text-xs font-bold tracking-[0.2em] text-stone-400 uppercase">Input Variables</h2>
                  </div>
                  <div className="space-y-4">
                    <SliderInput label="Spot Price" value={S} onChange={setS} min={1} max={500} step={0.01} unit="$" />
                    <SliderInput label="Strike Price" value={K} onChange={setK} min={1} max={500} step={0.01} unit="$" />
                    <SliderInput label="Time (Years)" value={T} onChange={setT} min={0.01} max={5} step={0.01} unit=" yr" />
                    <SliderInput label="Risk-Free Rate" value={r} onChange={setR} min={0} max={20} step={0.1} unit="%" />
                    <SliderInput label="Volatility" value={sigma} onChange={setSigma} min={1} max={200} step={1} unit="%" />
                  </div>
               </GlassCard>
            </div>
            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KPICard title="Call Value" value={result.callPrice} icon={TrendingUp} type="positive" />
                <KPICard title="Put Value" value={result.putPrice} icon={DollarSign} type="negative" />
              </div>
              <GlassCard>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                      <XAxis dataKey="price" stroke="#a8a29e" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
                      <YAxis stroke="#a8a29e" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)' }} />
                      <Line type="monotone" dataKey="call" stroke="#34d399" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="put" stroke="#94a3b8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <GreekCard name="Delta" value={result.delta} description="Sensitivity to price" />
                  <GreekCard name="Gamma" value={result.gamma} description="Rate of delta change" />
                  <GreekCard name="Theta" value={result.theta} description="Time decay" />
                  <GreekCard name="Vega" value={result.vega} description="Sensitivity to vol" />
                  <GreekCard name="Rho" value={result.rho} description="Sensitivity to rates" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'montecarlo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-4">
              <GlassCard className="h-full">
                <TickerSearch ticker={ticker} setTicker={setTicker} handleStockSearch={handleStockSearch} isFetchingPrice={isFetchingPrice} priceError={priceError} />
                <div className="mb-8">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-stone-400 font-bold mb-3 block">Option Type</label>
                  <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
                    <button onClick={() => setMcParams({ ...mcParams, optionType: 'call' })} className={`py-2 rounded-lg text-xs font-bold transition-all ${mcParams.optionType === 'call' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'}`}>CALL</button>
                    <button onClick={() => setMcParams({ ...mcParams, optionType: 'put' })} className={`py-2 rounded-lg text-xs font-bold transition-all ${mcParams.optionType === 'put' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'}`}>PUT</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <SliderInput label="Spot Price" value={mcParams.S0} onChange={(v: number) => setMcParams({ ...mcParams, S0: v })} min={1} max={500} step={0.01} unit="$" />
                  <SliderInput label="Strike Price" value={mcParams.K} onChange={(v: number) => setMcParams({ ...mcParams, K: v })} min={1} max={500} step={0.01} unit="$" />
                  <SliderInput label="Iterations" value={mcParams.iterations} onChange={(v: number) => setMcParams({ ...mcParams, iterations: Math.round(v) })} min={1000} max={10000} step={500} />
                </div>
                <button onClick={runMonteCarloSimulation} disabled={isCalculating} className="w-full mt-8 bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-xs tracking-widest">{isCalculating ? <Loader2 className="animate-spin mx-auto" /> : 'RUN SIMULATION'}</button>
              </GlassCard>
            </div>
            <div className="lg:col-span-8 space-y-6">
               {mcResults && (
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl"><div className="text-[10px] uppercase text-emerald-600/70 font-bold mb-1 tracking-wider">Estimated Price</div><div className="text-2xl font-light text-emerald-700">${mcResults.optionPrice.toFixed(4)}</div></div>
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl"><div className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Std Error</div><div className="text-2xl font-light text-slate-700">±{mcResults.standardError.toFixed(4)}</div></div>
                    <div className="bg-purple-50 border border-purple-100 p-5 rounded-2xl"><div className="text-[10px] uppercase text-purple-500 font-bold mb-1 tracking-wider">ITM Prob</div><div className="text-2xl font-light text-purple-700">{mcResults.inTheMoneyProbability.toFixed(1)}%</div></div>
                    <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl"><div className="text-[10px] uppercase text-rose-500 font-bold mb-1 tracking-wider">95% VaR</div><div className="text-2xl font-light text-rose-700">${mcResults.valueAtRisk.toFixed(4)}</div></div>
                 </div>
               )}
               <GlassCard className="min-h-[400px]">
                  <h3 className="text-xl font-light text-stone-800 mb-6">Monte Carlo Paths</h3>
                  {!mcResults ? (
                    <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-2xl bg-stone-50/50"><Activity className="text-stone-300 mb-4 w-12 h-12" /><p className="text-stone-400 text-xs font-mono uppercase tracking-widest">Awaiting Simulation</p></div>
                  ) : (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mcChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                          <XAxis dataKey="step" hide />
                          <YAxis stroke="#a8a29e" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)' }} />
                          {mcResults.visualPaths.map((_: any, idx: number) => (
                            <Line key={idx} type="natural" dataKey={`path${idx}`} stroke={`hsl(${140 + idx * 10}, 40%, 60%)`} strokeWidth={1} dot={false} strokeOpacity={0.4} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
               </GlassCard>
            </div>
          </div>
        )}

        {activeTab === 'allocation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="lg:col-span-12">
               <GlassCard>
                 <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-light text-stone-800">Asset Allocation</h2>
                   <button onClick={addAsset} className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all"><Plus size={14} /> Add Asset</button>
                 </div>
                 <div className="overflow-hidden rounded-2xl border border-stone-200">
                    <table className="w-full text-left border-collapse">
                      <thead><tr className="bg-stone-50 text-[10px] uppercase tracking-[0.15em] text-stone-400"><th className="p-4 font-bold">Asset</th><th className="p-4 font-bold">Value</th><th className="p-4 font-bold">Target %</th><th className="p-4"></th></tr></thead>
                      <tbody className="divide-y divide-stone-100 bg-white">
                        {assets.map((asset) => (
                          <tr key={asset.id} className="hover:bg-stone-50 transition-colors group">
                            <td className="p-4"><input type="text" value={asset.name} onChange={e => updateAsset(asset.id, 'name', e.target.value)} className="bg-transparent text-stone-700 focus:outline-none focus:text-rose-500 font-medium transition-colors" /></td>
                            <td className="p-4"><div className="flex items-center text-stone-600"><span className="mr-1 text-stone-400">$</span><input type="number" value={asset.currentValue || ''} onChange={e => updateAsset(asset.id, 'currentValue', parseFloat(e.target.value) || 0)} className="bg-transparent focus:outline-none font-mono" /></div></td>
                            <td className="p-4"><div className="flex items-center text-stone-600"><input type="number" value={asset.targetAllocation || ''} onChange={e => updateAsset(asset.id, 'targetAllocation', parseFloat(e.target.value) || 0)} className="bg-transparent focus:outline-none font-mono w-16" /><span className="ml-1 text-stone-400">%</span></div></td>
                            <td className="p-4 text-right"><button onClick={() => removeAsset(asset.id)} className="text-stone-300 hover:text-rose-400 transition-colors"><Trash2 size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
                 <div className="mt-6 flex justify-end">
                    {calculations.isValid ? <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 text-xs font-medium"><CheckCircle2 size={14} /> Allocation Valid</div> : <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-4 py-2 rounded-full border border-rose-100 text-xs font-medium"><AlertTriangle size={14} /> Fix Allocation</div>}
                 </div>
               </GlassCard>
             </div>
             <div className="lg:col-span-8">
                <GlassCard>
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400 mb-8">Allocation Balance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-stone-400 mb-4 tracking-widest uppercase">Current Distribution</span>
                        <div className="h-[200px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={calculations.currentData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">{calculations.currentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)' }} /></PieChart></ResponsiveContainer></div>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-stone-400 mb-4 tracking-widest uppercase">Target Distribution</span>
                        <div className="h-[200px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={calculations.targetData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">{calculations.targetData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)' }} /></PieChart></ResponsiveContainer></div>
                    </div>
                  </div>
                </GlassCard>
             </div>
             <div className="lg:col-span-4">
               <GlassCard className="h-full">
                 <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400 mb-8">Rebalancing Actions</h3>
                 <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                   {calculations.actionableItems.length === 0 ? <div className="flex flex-col items-center justify-center h-[200px] text-center"><CheckCircle2 className="w-12 h-12 text-stone-200 mb-4" /><p className="text-stone-400 text-sm font-medium">Perfectly Balanced</p></div> : calculations.actionableItems.map((action) => (
                       <div key={action.id} className={`p-4 rounded-xl border flex justify-between items-center ${action.action === 'BUY' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                         <div className="flex items-center gap-3">{action.action === 'BUY' ? <TrendingUp className="text-emerald-500" size={18} /> : <TrendingDown className="text-rose-500" size={18} />}<div><div className="text-sm font-semibold text-stone-700">{action.name}</div><div className="text-[9px] text-stone-400 uppercase tracking-wider">{action.action} ORDER</div></div></div>
                         <div className="text-right"><div className={`font-mono text-sm ${action.action === 'BUY' ? 'text-emerald-600' : 'text-rose-600'}`}>${Math.abs(action.delta).toLocaleString()}</div></div>
                       </div>
                   ))}
                 </div>
               </GlassCard>
             </div>
          </div>
        )}
        <InfoSection activeTab={activeTab} />
      </div>
    </main>
  );
}