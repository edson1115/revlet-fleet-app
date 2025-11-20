"use client";

import { Loader2 } from "lucide-react";
import clsx from "clsx";

type BtnProps = {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  type?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  full?: boolean;
};

/* ----------------------------------------
   1) PRIMARY — Tesla Green / Black mode
---------------------------------------- */
export function TeslaPrimaryButton({
  children,
  onClick,
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  full = false,
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "bg-[#0A0A0A] text-white rounded-lg px-4 py-2 font-medium",
        "transition-all duration-150 ease-in-out",
        "hover:bg-black disabled:opacity-50",
        full && "w-full",
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
      ) : (
        children
      )}
    </button>
  );
}

/* ----------------------------------------
   2) SECONDARY — Light Gray (Tesla-style)
---------------------------------------- */
export function TeslaSecondaryButton({
  children,
  onClick,
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  full = false,
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "bg-[#F5F5F5] text-black rounded-lg px-4 py-2",
        "hover:bg-[#EDEDED] transition-all",
        "disabled:opacity-50",
        full && "w-full",
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
      ) : (
        children
      )}
    </button>
  );
}

/* ----------------------------------------
   3) GHOST — clean text-only actions
---------------------------------------- */
export function TeslaGhostButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "text-gray-700 hover:text-black transition",
        "px-2 py-1 rounded",
        "disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ----------------------------------------
   4) DANGER — red Tesla action
---------------------------------------- */
export function TeslaDangerButton({
  children,
  onClick,
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  full = false,
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "bg-[#FF3B30] text-white rounded-lg px-4 py-2",
        "hover:bg-[#E03129] transition",
        "disabled:opacity-50",
        full && "w-full",
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
      ) : (
        children
      )}
    </button>
  );
}

/* ----------------------------------------
   5) ICON BUTTON — circular Tesla style
---------------------------------------- */
export function TeslaIconButton({
  children,
  onClick,
  disabled,
  className = "",
}: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "w-10 h-10 flex items-center justify-center rounded-full",
        "bg-[#F5F5F5] hover:bg-[#EAEAEA]",
        "transition disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}
