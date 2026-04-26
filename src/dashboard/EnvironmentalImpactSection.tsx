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
    unitLabel: "g",
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
      <p className="env-desc">AICO requires small costs to optimize your prompts. The metrics below account for this to display the net CO2, water, and energy saved.</p>
      <div className="env-net-stack">
        <article className="stat-card stat-card--net">
          <p className="stat-label">Net CO2 Saved</p>
          <p className="stat-value">{formatCo2(totals.netCo2gSaved)}</p>
        </article>

        <article className="stat-card stat-card--net">
          <p className="stat-label">Net Water Saved</p>
          <p className="stat-value">{formatWater(totals.netWaterMlSaved)}</p>
        </article>

        <article className="stat-card stat-card--net">
          <p className="stat-label">Net Energy Saved</p>
          <p className="stat-value">{formatEnergy(totals.netEnergyWhSaved)}</p>
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
