# Clara

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-Rose_&_Stone-e11d48?style=flat-square&logo=tailwind-css)

**Clara** is a financial modeling suite designed for clarity.

Moving away from the noise of traditional trading terminals, Clara offers a calm, minimalist environment for complex derivatives pricing and stochastic simulation. It reduces financial engineering to its purest form: input, logic, and insight.

🔗 **[View Live Application](https://clara-47o8-m9d0o7drv-melanies-projects-66f090eb.vercel.app/)**

---

## Essence & Utility

### 1. Valuation (Black-Scholes)
A precise implementation of the Black-Scholes-Merton model. Clara derives the theoretical fair value of European options and visualizes the sensitivity of price to market changes through the Greeks ($\Delta$, $\Gamma$, $\Theta$, $\nu$, $\rho$).

### 2. Simulation (Monte Carlo)
An exploration of uncertainty. Using Geometric Brownian Motion (GBM), the system projects thousands of potential future price paths to estimate Value at Risk (VaR) and the probability of profit, rendered on a fluid, interactive canvas.

### 3. Connection (Live Data)
Integrated with AlphaVantage to seamlessly pull real-time spot prices, bridging the gap between theoretical modeling and current market reality.

### 4. Harmony (Portfolio)
A dedicated tool for strategic alignment. It compares current asset distribution against target goals, generating a clear schedule of actions to restore balance to your portfolio.

---

## The Foundation

Clara is built on a modern, type-safe stack that prioritizes correctness and user experience.

* **Framework:** Next.js (App Router)
* **Logic:** TypeScript
* **Aesthetic:** Tailwind CSS (Glassmorphism & Minimalist Typography)
* **Visualization:** Recharts

---

## Mathematical Honesty

The core calculations are performed client-side with zero reliance on opaque libraries.

* **Cumulative Distribution:** Utilizes the Abramowitz and Stegun numerical approximation for the standard normal CDF, ensuring precision to six decimal places.
* **Stochastic Processes:** Random walks are generated using the Box-Muller transform to create normally distributed random variables from uniform sources.

---

**Designed & Developed by Melanie Kwak**
