import { useState } from "react";
import TwinPicker from "./components/TwinPicker";
import MatchResult from "./components/MatchResult";
import Planner from "./components/Planner";
import SimViz from "./components/SimViz";

const STEPS = ["twins", "match", "plan", "sim"];

export default function App() {
  const [step, setStep] = useState("twins");
  const [twins, setTwins] = useState([]);
  const [selected, setSelected] = useState({ a: null, b: null });
  const [matchData, setMatchData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [simData, setSimData] = useState(null);

  const reset = () => {
    setStep("twins");
    setSelected({ a: null, b: null });
    setMatchData(null);
    setSessionId(null);
    setPlanData(null);
    setSimData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent cursor-pointer"
            onClick={reset}
          >
            Social Twin Trainer
          </h1>
          {/* Step indicators */}
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  step === s
                    ? "bg-rose-500 text-white"
                    : STEPS.indexOf(step) > i
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {step === "twins" && (
          <TwinPicker
            twins={twins}
            setTwins={setTwins}
            selected={selected}
            setSelected={setSelected}
            onMatch={(data) => {
              setMatchData(data.analysis);
              setSessionId(data.session_id);
              setStep("match");
            }}
          />
        )}

        {step === "match" && matchData && (
          <MatchResult
            data={matchData}
            onPlan={() => setStep("plan")}
            onBack={() => setStep("twins")}
          />
        )}

        {step === "plan" && sessionId && (
          <Planner
            sessionId={sessionId}
            onPlanReady={(data) => {
              setPlanData(data);
              setStep("sim");
            }}
            onBack={() => setStep("match")}
          />
        )}

        {step === "sim" && sessionId && (
          <SimViz
            sessionId={sessionId}
            planData={planData}
            simData={simData}
            setSimData={setSimData}
            onBack={() => setStep("plan")}
            onReset={reset}
          />
        )}
      </main>
    </div>
  );
}
