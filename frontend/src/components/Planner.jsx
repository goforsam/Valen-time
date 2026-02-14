import { useState } from "react";
import { api } from "../api";

const GOALS = [
  "First coffee date",
  "Fun adventurous outing",
  "Deep meaningful conversation",
  "Creative collaboration session",
  "Casual hangout & get to know each other",
];

export default function Planner({ sessionId, onPlanReady, onBack }) {
  const [goal, setGoal] = useState("");
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  const generate = async () => {
    const g = goal || custom;
    if (!g) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.plan(sessionId, g);
      setPlan(res.plan);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">&larr; Back</button>
      <h2 className="text-xl font-semibold">Plan the Date</h2>

      <div className="flex flex-wrap gap-2">
        {GOALS.map((g) => (
          <button
            key={g}
            onClick={() => { setGoal(g); setCustom(""); }}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              goal === g ? "bg-rose-600 text-white" : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <input
        placeholder="Or type a custom goal..."
        value={custom}
        onChange={(e) => { setCustom(e.target.value); setGoal(""); }}
        className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
      />

      <button
        onClick={generate}
        disabled={loading || (!goal && !custom)}
        className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 rounded-xl font-semibold transition"
      >
        {loading ? "Generating plan..." : "Generate Date Plan"}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {plan && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-rose-400">{plan.title || "Your Date Plan"}</h3>

          <div className="space-y-3">
            {(plan.steps || []).map((s, i) => (
              <div key={i} className="flex gap-4 items-start bg-gray-800/60 rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {s.order || i + 1}
                </div>
                <div>
                  <div className="font-medium">{s.activity}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {s.duration_min} min &middot; {s.vibe}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {plan.tips && (
            <div className="bg-gray-800/60 rounded-xl p-4">
              <h4 className="font-semibold text-blue-400 mb-2">Tips</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {plan.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          <button
            onClick={() => onPlanReady(plan)}
            className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 rounded-xl font-semibold transition"
          >
            Simulate This Date &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
