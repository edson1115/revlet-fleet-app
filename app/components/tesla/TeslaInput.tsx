"use client";

import clsx from "clsx";

type BaseProps = {
  label?: string;
  description?: string;
  error?: string | null;
  className?: string;
  disabled?: boolean;
};

/* ----------------------------------------------------
   SHARED WRAPPER
---------------------------------------------------- */
function FieldWrapper({
  label,
  description,
  error,
  children,
}: {
  label?: string;
  description?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <div className="text-sm font-medium text-gray-800">
          {label}
        </div>
      )}

      {children}

      {description && (
        <div className="text-xs text-gray-500">{description}</div>
      )}

      {error && (
        <div className="text-xs text-red-600 pt-1">{error}</div>
      )}
    </div>
  );
}

/* ----------------------------------------------------
   TEXT INPUT
---------------------------------------------------- */
export function TeslaInput({
  label,
  description,
  error,
  className = "",
  disabled = false,
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper label={label} description={description} error={error}>
      <input
        {...props}
        disabled={disabled}
        className={clsx(
          "w-full rounded-lg px-3 py-2 bg-[#F5F5F5] text-black",
          "border border-transparent focus:border-black",
          "transition-all outline-none",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-red-400 bg-red-50",
          className
        )}
      />
    </FieldWrapper>
  );
}

/* ----------------------------------------------------
   NUMBER INPUT
---------------------------------------------------- */
export function TeslaNumberInput({
  label,
  description,
  error,
  className = "",
  disabled = false,
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper label={label} description={description} error={error}>
      <input
        {...props}
        type="number"
        disabled={disabled}
        className={clsx(
          "w-full rounded-lg px-3 py-2 bg-[#F5F5F5] text-black",
          "border border-transparent focus:border-black",
          "transition outline-none",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-red-400 bg-red-50",
          className
        )}
      />
    </FieldWrapper>
  );
}

/* ----------------------------------------------------
   SELECT INPUT
---------------------------------------------------- */
export function TeslaSelect({
  label,
  description,
  error,
  className = "",
  disabled = false,
  children,
  ...props
}: BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldWrapper label={label} description={description} error={error}>
      <select
        {...props}
        disabled={disabled}
        className={clsx(
          "w-full rounded-lg px-3 py-2 bg-[#F5F5F5] text-black",
          "border border-transparent focus:border-black",
          "transition outline-none",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-red-400 bg-red-50",
          className
        )}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}

/* ----------------------------------------------------
   TEXTAREA
---------------------------------------------------- */
export function TeslaTextarea({
  label,
  description,
  error,
  className = "",
  disabled = false,
  ...props
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldWrapper label={label} description={description} error={error}>
      <textarea
        {...props}
        disabled={disabled}
        className={clsx(
          "w-full rounded-lg px-3 py-2 bg-[#F5F5F5] text-black",
          "border border-transparent focus:border-black",
          "transition outline-none",
          "min-h-[90px]",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-red-400 bg-red-50",
          className
        )}
      />
    </FieldWrapper>
  );
}



