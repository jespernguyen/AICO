import React from "react";
import { useStorage } from "../hooks/useStorage";
import EnvironmentalImpactSection from "./EnvironmentalImpactSection";
import { DEFAULT_MODEL, getModelById } from "../constants/models";
import { calculateOptimizationImpact } from "../utils/environmentalImpact";
import { getSelectedModel } from "../utils/storage";

type StatTone = "used" | "saved";

interface Totals {
  usedTokens: number;
  usedCo2: number;
  usedWater: number;
  usedEnergy: number;
  savedTokens: number;
  savedCo2: number;
  savedWater: number;
  savedEnergy: number;
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const EMPTY_TOTALS: Totals = {
  usedTokens: 0,
  usedCo2: 0,
  usedWater: 0,
  usedEnergy: 0,
  savedTokens: 0,
  savedCo2: 0,
  savedWater: 0,
  savedEnergy: 0,
};

export default function Dashboard() {
  const { records, loading, error, refreshRecords, clearRecords } = useStorage();
  const [selectedModelId, setSelectedModelId] = React.useState(DEFAULT_MODEL.id);
  const selectedModel = React.useMemo(
    () => getModelById(selectedModelId),
    [selectedModelId]
  );
  const [impactViewResetAt, setImpactViewResetAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    getSelectedModel()
      .then((id) => {
        if (id) {
          setSelectedModelId(id);
        }
      })
      .catch(() => {});
  }, []);

  const optimizationHistory = React.useMemo(() => {
    const sortedRecords = [...records].sort((a, b) => a.createdAt - b.createdAt);
    const visibleRecords =
      impactViewResetAt === null
        ? sortedRecords
        : sortedRecords.filter((record) => record.createdAt > impactViewResetAt);

    return visibleRecords.map((record) =>
      calculateOptimizationImpact({
        originalPromptTokens: record.originalAnalysis.tokenCount,
        optimizedPromptTokens: record.optimizedAnalysis.tokenCount,
        baselineModel: selectedModel,
      })
    );
  }, [records, selectedModel, impactViewResetAt]);

  const totals = records.reduce<Totals>((accumulator, record) => {
    accumulator.usedTokens += record.originalAnalysis.tokenCount;
    accumulator.usedCo2 += record.originalAnalysis.estimatedCo2Grams;
    accumulator.usedWater += record.originalAnalysis.estimatedWaterMl;
    accumulator.usedEnergy += record.originalAnalysis.estimatedEnergyWh;
    accumulator.savedTokens += record.comparison.tokensSaved;
    accumulator.savedCo2 += record.comparison.co2SavedGrams;
    accumulator.savedWater += record.comparison.waterSavedMl;
    accumulator.savedEnergy += record.comparison.energySavedWh;
    return accumulator;
  }, { ...EMPTY_TOTALS });

  const handleClearData = async () => {
    const confirmed = window.confirm("Clear all stored analysis records?");
    if (!confirmed) {
      return;
    }
    await clearRecords();
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <h1>AICO Dashboard</h1>
        <div className="dashboard-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void refreshRecords()}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => void handleClearData()}
            disabled={loading || records.length === 0}
          >
            Clear data
          </button>
        </div>
      </header>

      <p className="dashboard-summary">Prompts analyzed: {records.length}</p>

      {loading && <p className="dashboard-loading">Loading...</p>}
      {error && <p className="dashboard-error">{error}</p>}

      {!loading && records.length === 0 ? (
        <section className="dashboard-empty">
          <p>No prompts optimized yet. Use the popup to analyze a prompt.</p>
        </section>
      ) : (
        <>
          <section className="dashboard-section">
            <h2>Used (without AICO)</h2>
            <div className="stats-grid">
              <StatCard label="Tokens" value={totals.usedTokens} tone="used" />
              <StatCard label="CO2" value={totals.usedCo2} unit="g" tone="used" />
              <StatCard label="Water" value={totals.usedWater} unit="mL" tone="used" />
              <StatCard label="Energy" value={totals.usedEnergy} unit="Wh" tone="used" />
            </div>
          </section>

          <section className="dashboard-section">
            <h2>Saved with AICO</h2>
            <div className="stats-grid">
              <StatCard label="Tokens Saved" value={totals.savedTokens} tone="saved" />
              <StatCard label="CO2 Saved" value={totals.savedCo2} unit="g" tone="saved" />
              <StatCard
                label="Water Saved"
                value={totals.savedWater}
                unit="mL"
                tone="saved"
              />
              <StatCard
                label="Energy Saved"
                value={totals.savedEnergy}
                unit="Wh"
                tone="saved"
              />
            </div>
          </section>

          <EnvironmentalImpactSection
            optimizationHistory={optimizationHistory}
            onResetSession={() => setImpactViewResetAt(Date.now())}
          />
        </>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit?: string;
  tone: StatTone;
}) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">
        {numberFormatter.format(value)}
        {unit ? <span className="stat-unit"> {unit}</span> : null}
      </p>
    </article>
  );
}
