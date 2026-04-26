import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OptimizationImpactResult } from "../types/environmental";
import {
  formatCo2,
  formatEnergy,
  formatWater,
} from "../utils/environmentalImpact";
import "./EnvironmentalImpactSection.css";

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

interface EnvironmentalImpactSectionProps {
  optimizationHistory: OptimizationImpactResult[];
  onResetSession: () => void;
}

interface ChartDatum {
  optimizationNumber: number;
  original: number;
  withAico: number;
}

type MetricTab = "co2" | "water" | "energy";
type MetricKey = "co2g" | "waterMl" | "energyWh";

const METRIC_CONFIG: Record<
  MetricTab,
  {
    label: string;
    chartTitle: string;
    unitLabel: string;
    key: MetricKey;
    formatter: (value: number) => string;
  }
> = {
  co2: {
    label: "CO2",
    chartTitle: "Projected CO2 Cost Over Reuse",
    unitLabel: "g CO2e",
    key: "co2g",
    formatter: formatCo2,
  },
  water: {
    label: "Water",
    chartTitle: "Projected Water Cost Over Reuse",
    unitLabel: "mL",
    key: "waterMl",
    formatter: formatWater,
  },
  energy: {
    label: "Energy",
    chartTitle: "Projected Energy Cost Over Reuse",
    unitLabel: "Wh",
    key: "energyWh",
    formatter: formatEnergy,
  },
};

export default function EnvironmentalImpactSection({
  optimizationHistory,
  onResetSession,
}: EnvironmentalImpactSectionProps) {
  const [activeMetric, setActiveMetric] = useState<MetricTab>("co2");

  const totals = useMemo(
    () =>
      optimizationHistory.reduce(
        (aggregate, impact) => ({
          netEnergyWhSaved: aggregate.netEnergyWhSaved + impact.netSaved.energyWh,
          netCo2gSaved: aggregate.netCo2gSaved + impact.netSaved.co2g,
          netWaterMlSaved: aggregate.netWaterMlSaved + impact.netSaved.waterMl,
        }),
        {
          netEnergyWhSaved: 0,
          netCo2gSaved: 0,
          netWaterMlSaved: 0,
        }
      ),
    [optimizationHistory]
  );

  const chartData = useMemo<ChartDatum[]>(() => {
    const key = METRIC_CONFIG[activeMetric].key;
    let runningOriginal = 0;
    let runningWithAico = 0;

    return optimizationHistory.map((entry, index) => {
      runningOriginal += entry.originalCost[key];
      runningWithAico += entry.optimizationCost[key] + entry.optimizedCost[key];
      return {
        optimizationNumber: index + 1,
        original: runningOriginal,
        withAico: runningWithAico,
      };
    });
  }, [activeMetric, optimizationHistory]);

  const hasNegativeNetSavings =
    totals.netEnergyWhSaved < 0 || totals.netCo2gSaved < 0 || totals.netWaterMlSaved < 0;
  const activeConfig = METRIC_CONFIG[activeMetric];

  return (
    <section className="dashboard-section">
      <h2>Overall Environmental Impact</h2>
      <hr className="line" />
      <p className="env-desc">AICO requires small costs to optimize your prompts. The metrics below account for this to display the net CO2, water, and energy saved. The graph shows the metric you would have used without optimizations vs the metric you did use with your improved prompts.</p>
      <div className="env-section-grid">
        <div className="env-net-stack">
          <article className="stat-card stat-card--saved">
            <p className="stat-label">Net CO2 Saved</p>
            <p className="stat-value">{formatCo2(totals.netCo2gSaved)}</p>
          </article>

          <article className="stat-card stat-card--saved">
            <p className="stat-label">Net Water Saved</p>
            <p className="stat-value">{formatWater(totals.netWaterMlSaved)}</p>
          </article>

          <article className="stat-card stat-card--saved">
            <p className="stat-label">Net Energy Saved</p>
            <p className="stat-value">{formatEnergy(totals.netEnergyWhSaved)}</p>
          </article>
        </div>

        <article className="env-chart-card" aria-live="polite">
          <div className="env-metric-tabs" role="tablist" aria-label="Environmental metric tabs">
            {(Object.keys(METRIC_CONFIG) as MetricTab[]).map((metric) => (
              <button
                key={metric}
                type="button"
                role="tab"
                aria-selected={activeMetric === metric}
                className={`env-metric-tab ${activeMetric === metric ? "is-active" : ""}`}
                onClick={() => setActiveMetric(metric)}
              >
                {METRIC_CONFIG[metric].label}
              </button>
            ))}
          </div>
          <p className="env-chart-title">{activeConfig.chartTitle}</p>
          <div className="env-chart-wrapper">
            {optimizationHistory.length === 0 ? (
              <div className="env-chart-empty">
                <p>No optimizations this session yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 12, right: 18, bottom: 24, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="optimizationNumber"
                    tickFormatter={(value) => String(value)}
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Number of Optimizations",
                      position: "insideBottom",
                      offset: -14,
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    tickFormatter={(value: number) =>
                      activeConfig.formatter(value).split(" ")[0]
                    }
                    tick={{ fontSize: 12 }}
                  />
                  <Legend verticalAlign="top" height={28} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${numberFormatter.format(value)} ${activeConfig.unitLabel}`,
                      name,
                    ]}
                    labelFormatter={(value) => `Optimization #${value}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="original"
                    name="Used (without AICO)"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="withAico"
                    name="New Usage (with AICO)"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </div>

      {hasNegativeNetSavings ? (
        <p className="env-negative-note">
          This optimization did not produce net environmental savings.
        </p>
      ) : null}

      <p className="env-disclaimer">
        Environmental estimates are approximate and depend on model efficiency,
        hardware, data center cooling, and energy mix. AICO uses configurable
        conservative estimates rather than claiming exact provider-specific impact.
      </p>
    </section>
  );
}
