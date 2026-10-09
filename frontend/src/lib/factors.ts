// Risk parameters and weights from docs/10-DATA-PROFILE-KASIRNUSA.md.
export const riskFactors = ["Usage", "Service", "Champion", "Commitments", "Payment"] as const;
type RiskFactor = (typeof riskFactors)[number];
export const factorWeight: Record<RiskFactor, number> = { Usage: 30, Service: 25, Champion: 20, Commitments: 15, Payment: 10 };
