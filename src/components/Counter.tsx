import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="counter">
      <h2>Counter</h2>
      <div className="counter-display">{count}</div>
      <div className="counter-buttons">
        <button onClick={() => setCount((c) => c - 1)}>Decrement</button>
        <button onClick={() => setCount(0)}>Reset</button>
        <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      </div>
    </div>
  );
}
