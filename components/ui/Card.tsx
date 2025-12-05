import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  className,
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]",

        padding === "none" && "p-0",
        padding === "sm" && "p-3",
        padding === "md" && "p-4",
        padding === "lg" && "p-6",

        className
      )}
      {...props}
    />
  );
}

interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardSection({ className, ...props }: CardSectionProps) {
  return (
    <div
      className={cn("py-2", className)}
      {...props}
    />
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold text-black tracking-tight",
        "mb-1",
        className
      )}
      {...props}
    />
  );
}

interface CardSubtitleProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardSubtitle({ className, ...props }: CardSubtitleProps) {
  return (
    <p
      className={cn(
        "text-sm text-gray-500 leading-tight",
        className
      )}
      {...props}
    />
  );
}



