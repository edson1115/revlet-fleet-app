"use client";

import * as React from "react";

type Props = {
  total: number;
  before?: number;
  after?: number;
  other?: number;
  onClick?: () => void;
  title?: string;
  className?: string;
};

/**
 * Small clickable pill that shows image counts.
 * - Shows "0" muted when there are no images.
 * - If before/after/other provided, shows a tooltip-style title.
 */
function ImageCountPillImpl({
  total,
  before = 0,
  after = 0,
  other = 0,
  onClick,
  title,
  className = "",
}: Props) {
  const aria = title ?? `Photos: total ${total} (before ${before}, after ${after}, other ${other})`;

  const content =
    total > 0 ? (
      <span className="inline-flex items-center gap-1">
        <span className="font-medium">{total}</span>
        <span className="text-[11px] text-gray-600">
          ({before}•{after}•{other})
        </span>
      </span>
    ) : (
      <span className="text-gray-400">0</span>
    );

  const classes =
    "inline-flex select-none items-center rounded-full border px-2 py-0.5 text-xs " +
    (onClick ? "cursor-pointer hover:bg-gray-50 " : "") +
    className;

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      title={aria}
      aria-label={aria}
    >
      {content}
    </button>
  ) : (
    <span className={classes} title={aria} aria-label={aria}>
      {content}
    </span>
  );
}

// Export both ways so default *and* named imports work.
export const ImageCountPill = ImageCountPillImpl;
export default ImageCountPillImpl;



