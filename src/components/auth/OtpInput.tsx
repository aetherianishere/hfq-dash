"use client";

import { useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

function toChars(value: string) {
  return Array.from({ length: 6 }, (_, index) => value[index] ?? " ");
}

export function OtpInput({ value, onChange, disabled, autoFocus }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function write(index: number, digit: string) {
    const chars = toChars(value);
    chars[index] = digit || " ";
    onChange(chars.join("").replace(/\s+$/, ""));
  }

  return (
    <div
      className="otp-row"
      onPaste={(event) => {
        event.preventDefault();
        const pasted = event.clipboardData
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, 6);
        if (!pasted) return;
        onChange(pasted);
        refs.current[Math.min(pasted.length, 5)]?.focus();
      }}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1}`}
          value={value[index]?.trim() ?? ""}
          onChange={(event) => {
            const digit = event.target.value.replace(/\D/g, "").slice(-1);
            write(index, digit);
            if (digit && index < 5) refs.current[index + 1]?.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !value[index]?.trim() && index > 0) {
              refs.current[index - 1]?.focus();
            }
            if (event.key === "ArrowLeft" && index > 0) {
              refs.current[index - 1]?.focus();
            }
            if (event.key === "ArrowRight" && index < 5) {
              refs.current[index + 1]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
