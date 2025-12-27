import React, { useState } from "react";

export default function MarksManager() {
  const [total, setTotal] = useState("");
  const [result, setResult] = useState("");

  return (
    <div className="card">
      <h3>Manage Marks</h3>

      <input placeholder="Total Marks" onChange={e => setTotal(e.target.value)} />
      <select onChange={e => setResult(e.target.value)}>
        <option value="">Result</option>
        <option value="PASS">PASS</option>
        <option value="FAIL">FAIL</option>
      </select>

      <button>Add / Update Marks</button>
    </div>
  );
}
