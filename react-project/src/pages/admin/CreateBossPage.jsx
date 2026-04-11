import { useState } from "react";
import { createBossApi } from "../../api/bossApi";

export default function CreateBossPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const data = await createBossApi({ name });
      setMessage(`Boss created: ${data.name}`);
      setName("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create boss");
    }
  };

  return (
    <div>
      <h2>Create Boss</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Boss name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button type="submit">Create</button>
      </form>

      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
    </div>
  );
}
