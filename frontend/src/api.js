const API = import.meta.env.VITE_API_URL || "";

async function request(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  listTwins: () => request("/twins"),
  createTwin: (data) => request("/twins", { method: "POST", body: JSON.stringify(data) }),
  deleteTwin: (id) => request(`/twins/${id}`, { method: "DELETE" }),
  match: (twin_a_id, twin_b_id) =>
    request("/match", { method: "POST", body: JSON.stringify({ twin_a_id, twin_b_id }) }),
  plan: (session_id, goal) =>
    request("/plan", { method: "POST", body: JSON.stringify({ session_id, goal }) }),
  simulate: (session_id, rounds = 6) =>
    request("/sim", { method: "POST", body: JSON.stringify({ session_id, rounds }) }),
};
