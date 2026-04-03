import React, { useEffect, useState } from "react";

const BOSSES = [
  "Kundun",
  "Medusa",
  "Nightmare",
  "Selupan",
  "Silvester",
  "Core",
  "Ferea",
  "Nyx",
  "GOD"
];

export default function BossCountdown() {
  const [timers, setTimers] = useState({});

  const setTimer = (boss, minutes) => {
    const target = Date.now() + minutes * 60 * 1000;

    setTimers(prev => ({
      ...prev,
      [boss]: target
    }));
  };

  const clearTimer = boss => {
    setTimers(prev => {
      const copy = { ...prev };
      delete copy[boss];
      return copy;
    });
  };

  const getRemain = target => {
    if (!target) return "—";

    const diff = target - Date.now();
    if (diff <= 0) return "00:00:00";

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="boss-grid">
      {BOSSES.map(boss => (
        <div key={boss} className="boss-card">
          <h3>{boss}</h3>

          <div className="timer">
            {getRemain(timers[boss])}
          </div>

          <div className="actions">
            <button onClick={() => setTimer(boss, 30)}>Set 30m</button>
            <button onClick={() => setTimer(boss, 60)}>Set 1h</button>
            <button onClick={() => clearTimer(boss)}>Clear</button>
          </div>
        </div>
      ))}
    </div>
  );
}