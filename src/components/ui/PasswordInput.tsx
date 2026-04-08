"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Optional element rendered absolutely inside the wrapper (e.g. a left-side icon). */
  leftIcon?: React.ReactNode;
  /** Class names applied to the wrapping div. */
  wrapperClassName?: string;
};

/**
 * Password input with a built-in eye toggle so users can verify what they typed.
 *
 * It strips any `pr-*` utility from the supplied `className` and substitutes `pr-10`
 * so the eye button always has room without callers having to remember to leave space.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  function PasswordInput(
    { leftIcon, wrapperClassName, className, ...rest },
    ref
  ) {
    const [show, setShow] = useState(false);

    const cleaned = (className ?? "").replace(/\bpr-[\w./]+/g, "").trim();
    const inputClassName = `${cleaned} pr-10`;

    return (
      <div className={`relative ${wrapperClassName ?? ""}`}>
        {leftIcon}
        <input
          ref={ref}
          type={show ? "text" : "password"}
          className={inputClassName}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }
);
