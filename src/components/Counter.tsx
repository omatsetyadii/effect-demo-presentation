import { useState } from "react";
import "./Counter.css";

interface CounterProps {
  initialValue?: number;
  step?: number;
}

export function Counter({ initialValue = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState<number>(initialValue);

  const increment = () => setCount((prev) => prev + step);
  const decrement = () => setCount((prev) => prev - step);
  const reset = () => setCount(initialValue);

  return (
    <div className="counter">
      <h2 className="counter-title">Counter</h2>
      <div className="counter-value" aria-live="polite" data-testid="counter-value">
        {count}
      </div>
      <div className="counter-controls">
        <button
          type="button"
          className="counter-button counter-button--decrement"
          onClick={decrement}
          aria-label="Decrement counter"
        >
          −
        </button>
        <button
          type="button"
          className="counter-button counter-button--reset"
          onClick={reset}
          aria-label="Reset counter"
        >
          Reset
        </button>
        <button
          type="button"
          className="counter-button counter-button--increment"
          onClick={increment}
          aria-label="Increment counter"
        >
          +
        </button>
      </div>
    </div>
  );
}
