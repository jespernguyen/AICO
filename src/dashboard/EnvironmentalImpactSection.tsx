import React, { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalysisRecord } from "../types/analysis";
import { OPTIMIZER_SYSTEM_PROMPT } from "../utils/ai";
import {
  formatCo2,
  formatEnergy,
  formatWater,
  mapRecordsToImpacts,
  tokenizeOrApproximate,
} from "../utils/environmentalImpact";
import "./EnvironmentalImpactSection.css";

const CHART_HEIGHT_PX = 240;

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

interface EnvironmentalImpactSectionProps {
  records: AnalysisRecord[];
}

interface ChartDatum {
  index: number;
  baselineCo2gAvoided: number;
  aicoCo2gUsed: number;
  netCo2gSaved: number;
}

export default function EnvironmentalImpactSection({
  records,
}: EnvironmentalImpactSectionProps) {
  const systemPromptTokens = useMemo(
    () => tokenizeOrApproximate(OPTIMIZER_SYSTEM_PROMPT),
    []
  );

  const impacts = useMemo(
    () => mapRecordsToImpacts(records, systemPromptTokens),
    [records, systemPromptTokens]
  );

  const totals = useMemo(
    () =>
      impacts.reduce(
        (aggregate, impact) => ({
          aicoEnergyWhUsed: aggregate.aicoEnergyWhUsed + impact.aico.energyWh,
          aicoCo2gUsed: aggregate.aicoCo2gUsed + impact.aico.co2g,
          aicoWaterMlUsed: aggregate.aicoWaterMlUsed + impact.aico.waterMl,
          baselineEnergyWhAvoided:
            aggregate.baselineEnergyWhAvoided + impact.baselineAvoided.energyWh,
          baselineCo2gAvoided:
            aggregate.baselineCo2gAvoided + impact.baselineAvoided.co2g,
          baselineWaterMlAvoided:
            aggregate.baselineWaterMlAvoided + impact.baselineAvoided.waterMl,
          netEnergyWhSaved: aggregate.netEnergyWhSaved + impact.net.energyWh,
          netCo2gSaved: aggregate.netCo2gSaved + impact.net.co2g,
          netWaterMlSaved: aggregate.netWaterMlSaved + impact.net.waterMl,
        }),
        {
          aicoEnergyWhUsed: 0,
          aicoCo2gUsed: 0,
          aicoWaterMlUsed: 0,
          baselineEnergyWhAvoided: 0,
          baselineCo2gAvoided: 0,
          baselineWaterMlAvoided: 0,
          netEnergyWhSaved: 0,
          netCo2gSaved: 0,
          netWaterMlSaved: 0,
        }
      ),
    [impacts]
  );

  const chartData = useMemo<ChartDatum[]>(() => {
    let runningBaseline = 0;
    let runningAico = 0;
    let runningNet = 0;

    return impacts.map((impact, index) => {
      runningBaseline += impact.baselineAvoided.co2g;
      runningAico += impact.aico.co2g;
      runningNet += impact.net.co2g;

      return {
        index: index + 1,
        baselineCo2gAvoided: runningBaseline,
        aicoCo2gUsed: runningAico,
        netCo2gSaved: runningNet,
      };
    });
  }, [impacts]);

  if (records.length === 0) {
    return (
      <section className="dashboard-section">
        <h2>Environmental Impact</h2>
        <div className="dashboard-empty">
          <p>No optimization history yet to estimate environmental impact.</p>
        </div>
      </section>
    );
  }

  const hasNegativeNetSavings =
    totals.netEnergyWhSaved < 0 || totals.netCo2gSaved < 0 || totals.netWaterMlSaved < 0;

  return (
    <section className="dashboard-section">
      <h2>Environmental Impact</h2>

      <div className="env-section-grid">
        <div className="env-cards">
          <article className="stat-card stat-card--saved">
            <p className="stat-label">Net Energy Saved</p>
            <p className="stat-value">{formatEnergy(totals.netEnergyWhSaved)}</p>
          </article>

          <article className="stat-card stat-card--saved">
            <p className="stat-label">Net CO2 Saved</p>
            <p className="stat-value">{formatCo2(totals.netCo2gSaved)}</p>
          </article>

          <article className="stat-card stat-card--saved">
            <p className="stat-label">Net Water Saved</p>
            <p className="stat-value">{formatWater(totals.netWaterMlSaved)}</p>
          </article>

          <article className="stat-card stat-card--footprint">
            <p className="stat-label">Estimated AICO Optimization Footprint</p>
            <p className="stat-value">{formatCo2(totals.aicoCo2gUsed)}</p>
          </article>
        </div>

        <article className="env-chart-card">
          <p className="env-chart-title">Cumulative CO2e Impact</p>
          <div className="env-chart-wrapper">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="index"
                  tickFormatter={(value) => String(value)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value: number) => numberFormatter.format(value)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${numberFormatter.format(value)} g CO2e`,
                    name,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="baselineCo2gAvoided"
                  name="Impact Avoided"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="aicoCo2gUsed"
                  name="AICO Impact Used"
                  stroke="#d97706"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="netCo2gSaved"
                  name="Net Gain"
                  stroke="#1d4ed8"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
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
