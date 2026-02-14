export default function MatchResult({ data, onPlan, onBack }) {
  const score = data.compatibility_score ?? data.raw ?? "?";
  const strengths = data.strengths || [];
  const challenges = data.challenges || [];
  const tip = data.tip || "";

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">&larr; Back</button>

      <div className="text-center">
        <div className="text-6xl font-black bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
          {typeof score === "number" ? `${score}%` : score}
        </div>
        <p className="text-gray-400 mt-1">Compatibility Score</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-800/60 rounded-xl p-4">
          <h3 className="font-semibold text-green-400 mb-2">Strengths</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            {strengths.map((s, i) => (
              <li key={i}>+ {s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-4">
          <h3 className="font-semibold text-amber-400 mb-2">Challenges</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            {challenges.map((c, i) => (
              <li key={i}>- {c}</li>
            ))}
          </ul>
        </div>
      </div>

      {tip && (
        <div className="bg-gray-800/60 rounded-xl p-4">
          <h3 className="font-semibold text-blue-400 mb-1">Tip</h3>
          <p className="text-sm text-gray-300">{tip}</p>
        </div>
      )}

      <button
        onClick={onPlan}
        className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 rounded-xl font-semibold transition"
      >
        Plan a Date &rarr;
      </button>
    </div>
  );
}
