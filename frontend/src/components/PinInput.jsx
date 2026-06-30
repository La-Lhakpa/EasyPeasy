import { useRef } from "react";

// Four single-digit boxes that behave like a phone-lock PIN entry: typing a
// digit auto-advances, backspace steps back, and pasting a 4-digit code fills
// all boxes. `value` is the 4-char string; `onChange` reports the new string.
export default function PinInput({ value = "", onChange, label, autoFocus = false }) {
  const refs = useRef([]);
  const digits = value.padEnd(4, " ").slice(0, 4).split("").map((c) => (c === " " ? "" : c));

  const setDigit = (index, digit) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").trimEnd());
  };

  const handleChange = (index, raw) => {
    const digit = raw.replace(/\D/g, "").slice(-1); // keep last numeric char
    if (!digit) {
      setDigit(index, "");
      return;
    }
    setDigit(index, digit);
    if (index < 3) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 3) refs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, 3)]?.focus();
  };

  return (
    <div className="pin-input" role="group" aria-label={label}>
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className="pin-box"
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]*"
          maxLength={1}
          aria-label={`${label} digit ${i + 1}`}
          value={digits[i]}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
