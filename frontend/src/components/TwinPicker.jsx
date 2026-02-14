import { useState, useEffect } from "react";
import { api } from "../api";

const PRESETS = [
  { name: "Alex", personality: "Introverted, analytical, dry humor", interests: "coding, chess, sci-fi movies", communication_style: "direct" },
  { name: "Jordan", personality: "Extroverted, empathetic, spontaneous", interests: "hiking, live music, cooking", communication_style: "warm" },
  { name: "Sam", personality: "Ambivert, creative, thoughtful", interests: "art, podcasts, coffee shops", communication_style: "playful" },
  { name: "Riley", personality: "Confident, adventurous, witty", interests: "travel, photography, startups", communication_style: "bold" },
];

export default function TwinPicker({ twins, setTwins, selected, setSelected, onMatch }) {
  const [form, setForm] = useState({ name: "", personality: "", interests: "", communication_style: "" });
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listTwins().then(setTwins).catch(() => {});
  }, []);

  const addTwin = async (data) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.createTwin(data || form);
      setTwins(await api.listTwins());
      setForm({ name: "", personality: "", interests: "", communication_style: "" });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const doMatch = async () => {
    if (!selected.a || !selected.b) return;
    setMatching(true);
    setError("");
    try {
      const res = await api.match(selected.a, selected.b);
      onMatch(res);
    } catch (e) {
      setError(e.message);
    }
    setMatching(false);
  };

  const toggleSelect = (id) => {
    if (selected.a === id) setSelected({ ...selected, a: null });
    else if (selected.b === id) setSelected({ ...selected, b: null });
    else if (!selected.a) setSelected({ ...selected, a: id });
    else if (!selected.b) setSelected({ ...selected, b: id });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Create Social Twins</h2>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => addTwin(p)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
            >
              + {p.name}
            </button>
          ))}
        </div>

        {/* Custom form */}
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <input
            placeholder="Personality (e.g. introverted, witty)"
            value={form.personality}
            onChange={(e) => setForm({ ...form, personality: e.target.value })}
            className="bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <input
            placeholder="Interests (comma-separated)"
            value={form.interests}
            onChange={(e) => setForm({ ...form, interests: e.target.value })}
            className="bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <input
            placeholder="Communication style (e.g. direct, playful)"
            value={form.communication_style}
            onChange={(e) => setForm({ ...form, communication_style: e.target.value })}
            className="bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <button
          onClick={() => addTwin()}
          disabled={loading || !form.name}
          className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 rounded-lg text-sm font-medium transition"
        >
          {loading ? "Adding..." : "Add Custom Twin"}
        </button>
      </div>

      {/* Twin cards – select two */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Select Two Twins to Match</h2>
        <p className="text-gray-400 text-sm mb-4">Click two cards, then hit Match.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {twins.map((t) => {
            const isA = selected.a === t.id;
            const isB = selected.b === t.id;
            return (
              <div
                key={t.id}
                onClick={() => toggleSelect(t.id)}
                className={`cursor-pointer rounded-xl p-4 border-2 transition ${
                  isA
                    ? "border-rose-500 bg-rose-500/10"
                    : isB
                    ? "border-pink-400 bg-pink-400/10"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
              >
                <div className="font-semibold text-lg">{t.name}</div>
                <div className="text-xs text-gray-400 mt-1">{t.personality}</div>
                <div className="text-xs text-gray-500 mt-1">{t.interests}</div>
                {(isA || isB) && (
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold text-rose-400">
                    {isA ? "Person A" : "Person B"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={doMatch}
        disabled={!selected.a || !selected.b || matching}
        className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 rounded-xl font-semibold transition"
      >
        {matching ? "Analyzing compatibility..." : "Match These Twins"}
      </button>
    </div>
  );
}
