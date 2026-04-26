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
        <div className="dashboard-title">
          <svg className="dashboard-icon" width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" rx="25" fill="#2563eb"/>
            <path d="M27.3379 143.568C25.2549 134.798 25.835 60.73 27.5015 53.695C28.4583 49.6562 34.2984 48.8325 35.1806 48.5291C43.1967 48.6973 107.243 46.4482 113.608 46.275C119.974 46.1017 154.971 44.9617 163.916 49.0763C167.364 50.662 167.278 50.7833 169.518 55.3034C171.912 60.1317 174 90.5956 174 97.3581C174 104.121 174 137.933 170.639 142.016C169.646 143.223 166.171 147.084 162.796 148.077C158.199 149.429 148.437 149.204 143.859 149.204C138.257 149.204 99.1531 149.047 96.8024 149.204C94.5616 149.204 91.3856 153.934 87.8393 157.35C85.1672 159.924 66.0244 174.574 64.1659 175.993C63.3315 176.327 62.7312 165.173 62.6109 157.35C62.5557 153.764 63.1905 149.369 62.0701 149.204C56.4003 148.367 35.9656 149.101 34.0602 148.63C31.8194 148.077 28.4583 148.285 27.3379 143.568Z" stroke="#D3EFFF" stroke-width="8" stroke-linecap="round"/>
            <path d="M133.226 116.174C134.388 114.074 139.581 100.899 137.756 92.8955C136.073 85.5133 128.332 72.7723 127.711 73.1617C127.478 73.3075 121.7 77.7279 121.452 77.8665C120.715 78.3729 125.081 83.2106 126.26 85.5432C127.597 88.1915 129.829 93.3684 130.185 94.5819C131.01 97.4016 128.086 107.376 125.932 112.081C123.423 117.56 118.709 120.779 113.63 123.812C109.741 126.134 98.6691 127.769 98.1554 126.99C97.1492 125.462 98.044 120.371 97.4449 120.743C96.989 121.299 87.0641 130.839 87.3427 131.511C87.5397 131.986 91.1094 135.025 91.6008 135.482C92.1352 135.963 97.7908 140.887 97.8254 140.102C97.8547 139.436 97.968 138.307 97.8878 137.623C97.8019 136.89 97.8644 135.886 97.9502 135.144C98.0003 134.71 99.5313 134.81 100.583 134.816C101.434 134.82 108.091 134.394 111.336 133.602C114.199 132.903 120.318 128.775 123.969 126.014C128.471 122.609 132.187 118.051 133.226 116.174Z" fill="#D3EFFF"/>
            <path d="M134.914 95.4574C135.037 95.4394 135.167 95.4581 135.284 95.5208C135.394 95.5795 135.465 95.6613 135.51 95.7269C135.591 95.8475 135.628 95.9835 135.647 96.0638C135.668 96.1541 135.683 96.2524 135.694 96.3265C135.7 96.3639 135.707 96.397 135.712 96.4261C135.747 96.4365 135.793 96.4477 135.852 96.4574C135.923 96.4691 135.988 96.4771 136.072 96.4886C136.527 96.5507 136.796 96.3642 137.277 96.1322C137.282 96.1287 137.303 96.1122 137.345 96.058C137.374 96.0203 137.392 95.9935 137.432 95.9398C137.463 95.8965 137.511 95.8332 137.569 95.7747L137.668 95.6927C137.776 95.6191 137.91 95.5735 138.063 95.5833C138.08 95.5845 138.096 95.5888 138.112 95.5912C138.526 103.564 134.265 114.297 133.226 116.174C132.187 118.051 128.471 122.61 123.969 126.014C120.318 128.775 114.199 132.903 111.336 133.602C108.091 134.394 101.435 134.82 100.583 134.816C99.5315 134.81 98.0004 134.71 97.9502 135.144C97.8644 135.887 97.8018 136.89 97.8877 137.623C97.9678 138.307 97.8546 139.436 97.8252 140.102C97.7907 140.887 92.1357 135.963 91.6006 135.483C91.1092 135.026 87.5398 131.986 87.3428 131.511C87.0657 130.838 96.9895 121.3 97.4454 120.743C98.0441 120.372 97.1492 125.462 98.1553 126.99C98.669 127.769 109.741 126.134 113.63 123.812C118.709 120.779 123.422 117.56 125.932 112.08C127.798 108.005 130.239 99.9771 130.323 96.0687C130.434 96.0364 130.539 96.0074 130.627 95.9808C130.837 95.917 131.004 95.8545 131.144 95.7689C131.162 95.7577 131.164 95.7552 131.207 95.7269C131.233 95.7096 131.294 95.6685 131.369 95.639C131.444 95.6096 131.603 95.5634 131.785 95.6302C131.927 95.6822 132.017 95.7774 132.071 95.8626L132.115 95.9417L132.163 96.0785C132.174 96.1212 132.182 96.1604 132.187 96.1888C132.198 96.2541 132.205 96.3244 132.212 96.3822C132.218 96.4357 132.224 96.4806 132.229 96.5179C132.84 96.489 133.246 96.2322 133.82 96.0199C134.054 95.9336 134.217 95.8308 134.354 95.7376C134.414 95.6967 134.501 95.6343 134.571 95.5912C134.642 95.5479 134.763 95.4795 134.914 95.4574Z" fill="#2F93FF"/>
            <path d="M65.8106 84.1054C64.7017 86.2338 59.8413 99.535 61.8671 107.49C63.7355 114.828 71.7951 127.37 72.4059 126.965C72.6347 126.813 78.2999 122.249 78.5447 122.104C79.2686 121.579 74.782 116.853 73.5453 114.551C72.1413 111.937 69.7799 106.818 69.394 105.614C68.4975 102.816 71.1696 92.771 73.2051 88.0137C75.5757 82.473 80.2073 79.136 85.2081 75.9766C89.0369 73.5576 100.064 71.6439 100.598 72.4104C101.642 73.912 100.876 79.0243 101.465 78.637C101.907 78.0693 111.588 68.2829 111.293 67.6181C111.084 67.148 107.439 64.1999 106.936 63.7554C106.39 63.2888 100.612 58.5082 100.598 59.2938C100.585 59.9601 100.5 61.0919 100.598 61.7737C100.702 62.5044 100.665 63.509 100.598 64.2536C100.558 64.6884 99.0254 64.6272 97.974 64.6479C97.1233 64.6646 90.4791 65.2582 87.255 66.1315C84.41 66.9021 78.3971 71.1837 74.8166 74.0356C70.4016 77.5523 66.8017 82.203 65.8106 84.1054Z" fill="#D3EFFF"/>
            <path d="M68.1692 95.7962C68.5417 95.9581 68.7255 96.2576 68.8303 96.4652C68.8566 96.5173 68.8803 96.5684 68.8997 96.6107C68.9203 96.6557 68.9351 96.6897 68.9504 96.7211C68.9587 96.7379 68.9656 96.7513 68.9709 96.7611C68.9834 96.7643 69.0006 96.7703 69.0237 96.7748C69.1629 96.8014 69.4198 96.827 69.9143 96.847C70.0677 96.8533 70.2189 96.8579 70.3674 96.8636C69.4547 100.574 68.9161 104.122 69.3938 105.614C69.7796 106.818 72.1411 111.937 73.5452 114.551C74.782 116.853 79.2681 121.579 78.5442 122.104C78.2963 122.251 72.6342 126.814 72.4055 126.965C71.7914 127.364 63.7357 114.827 61.8674 107.491C61.067 104.347 61.3419 100.369 62.0354 96.5755C63.1869 96.2447 64.1565 95.9649 64.4348 95.89L64.5832 95.8509L64.7288 95.9007C64.8573 95.9453 65.0077 96.0252 65.1164 96.1732C65.2334 96.3328 65.259 96.5117 65.2395 96.6625C65.21 96.8886 65.0745 97.081 64.9846 97.1957C65.248 97.1226 65.562 96.9971 65.8967 96.8382C66.5705 96.5183 67.2684 96.0983 67.7092 95.8285L67.9309 95.6927L68.1692 95.7962Z" fill="#2F93FF"/>
          </svg>
          <h1>AICO<br /><span className="dashboard-title-highlight">Dashboard</span></h1>
        </div>
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
            <h2>From the prompts you've given AICO</h2>
            <hr className="line" />
            <div className="stats-grid">
              <StatCard
                label="Total Tokens"
                value={totals.usedTokens}
                tone="used"
              />
              <StatCard
                label="Total CO2 Cost"
                value={totals.usedCo2}
                unit="g"
                tone="used"
              />
              <StatCard
                label="Total Water Cost"
                value={totals.usedWater}
                unit="mL"
                tone="used"
              />
              <StatCard
                label="Total Energy Cost"
                value={totals.usedEnergy}
                unit="Wh"
                tone="used"
              />
            </div>
          </section>

          <section className="dashboard-section">
            <h2>Through AICO Optimizations</h2>
            <hr className="line" />
            <div className="stats-grid">
              <StatCard
                label="Tokens Saved"
                value={totals.savedTokens}
                tone="saved"
              />
              <StatCard
                label="CO2 Saved"
                value={totals.savedCo2}
                unit="g"
                tone="saved"
              />
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
    <div className={`stat-card stat-card--${tone}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">
        {numberFormatter.format(value)}
        {unit ? <span className="stat-unit"> {unit}</span> : null}
      </p>
    </div>
  );
}
