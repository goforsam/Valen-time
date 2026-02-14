import { useState, useRef, useEffect } from "react";
import { api } from "../api";

export default function SimViz({ sessionId, planData, simData, setSimData, onBack, onReset }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  const runSim = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.simulate(sessionId, 6);
      setSimData(res.simulation);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Canvas engagement graph
  useEffect(() => {
    if (!simData?.exchanges || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const exchanges = simData.exchanges;
    const maxRounds = exchanges.length;
    if (maxRounds === 0) return;

    // Background
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (H / 10) * i;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(W - 10, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 10; i++) {
      ctx.fillText(100 - i * 10, 35, (H / 10) * i + 4);
    }

    // Plot line
    const stepX = (W - 60) / (maxRounds - 1 || 1);
    ctx.beginPath();
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    exchanges.forEach((ex, i) => {
      const x = 45 + i * stepX;
      const y = H - (ex.engagement_score / 100) * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    exchanges.forEach((ex, i) => {
      const x = 45 + i * stepX;
      const y = H - (ex.engagement_score / 100) * H;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fb7185";
      ctx.fill();
    });

    // X-axis labels
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.font = "10px sans-serif";
    exchanges.forEach((ex, i) => {
      const x = 45 + i * stepX;
      ctx.fillText(`R${ex.round || i + 1}`, x, H - 2);
    });
  }, [simData]);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">&larr; Back</button>
      <h2 className="text-xl font-semibold">Date Simulation</h2>

      {!simData && (
        <button
          onClick={runSim}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 rounded-xl font-semibold transition"
        >
          {loading ? "Simulating conversation..." : "Run Simulation"}
        </button>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {simData && (
        <>
          {/* Score */}
          <div className="text-center">
            <div className="text-5xl font-black bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
              {simData.overall_score ?? "?"}%
            </div>
            <p className="text-gray-400 mt-1">Overall Date Score</p>
          </div>

          {/* Engagement graph */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-300">Engagement Over Time</h3>
            <canvas ref={canvasRef} width={600} height={220} className="w-full rounded-xl" />
          </div>

          {/* Conversation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-300">Conversation</h3>
            {(simData.exchanges || []).map((ex, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 ${
                  ex.speaker?.includes("A") || i % 2 === 0
                    ? "bg-rose-500/10 border border-rose-500/30 ml-0 mr-12"
                    : "bg-blue-500/10 border border-blue-500/30 ml-12 mr-0"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {ex.speaker}
                  </span>
                  <span className="text-xs text-gray-500">
                    {ex.mood} &middot; {ex.engagement_score}/100
                  </span>
                </div>
                <p className="text-sm">{ex.message}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          {simData.summary && (
            <div className="bg-gray-800/60 rounded-xl p-4">
              <h3 className="font-semibold text-purple-400 mb-1">Summary</h3>
              <p className="text-sm text-gray-300">{simData.summary}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={runSim}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
            >
              Re-run Simulation
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-sm transition"
            >
              Start Over
            </button>
          </div>
        </>
      )}
    </div>
  );
}
