"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

const completionVariants = cva(
  "flex items-center gap-2 rounded-lg p-3 text-sm transition-all duration-200 rounded-full border-[.75px] px-2.5 w-fit h-7 flex items-center text-xs font-medium mb-2 shadow-[inset_0px_-2.10843px_0px_0px_rgb(244,241,238),_0px_1.20482px_6.3253px_0px_rgb(244,241,238)]",
  {
    variants: {
      variant: {
        success: "border-[#E9E3DD] text-[#36322F] bg-[#FBFAF9]",
        error: "border border-red-200 text-red-800 bg-red-50",
        warning: "border border-yellow-200 text-yellow-800 bg-yellow-50",
        pending: "border border-blue-200 text-blue-800 bg-blue-50",
      },
      size: {
        sm: "text-xs p-2",
        default: "text-sm p-3",
        lg: "text-base p-4",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        spin: "[&>svg]:animate-spin",
      },
    },
    defaultVariants: {
      variant: "success",
      size: "default",
      animation: "none",
    },
  }
);

export interface CompletionIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof completionVariants> {
  status?: "success" | "error" | "warning" | "pending";
  message?: string;
  showIcon?: boolean;
  progress?: number;
  children?: React.ReactNode;
}

export function CompletionIndicator({
  className,
  variant,
  size,
  animation,
  status = "success",
  message,
  showIcon = true,
  progress,
  children,
  ...props
}: CompletionIndicatorProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 shrink-0 fill-green-400" />,
    error: <XCircle className="h-4 w-4 shrink-0" />,
    warning: <AlertCircle className="h-4 w-4 shrink-0" />,
    pending: <Clock className="h-4 w-4 shrink-0" />,
  };

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        completionVariants({
          variant: variant || status,
          size,
          animation: status === "pending" ? "spin" : animation,
        }),
        className
      )}
      {...props}
    >
      {showIcon && icons[status]}
      <div className="flex-1 truncate">
        {message || (
          <>
            {status === "success" && "Completed successfully"}
            {status === "error" && "Failed to complete"}
            {status === "warning" && "Completed with warnings"}
            {status === "pending" && "Processing..."}
          </>
        )}
      </div>
      {typeof progress === "number" && (
        <div className="ml-2 text-xs font-medium">{progress}%</div>
      )}
      {status === "pending" && typeof progress === "number" && (
        <div className="relative h-1 w-20 overflow-hidden rounded-full bg-blue-100">
          <div
            className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {children && <Separator orientation="vertical" className="h-full" />}

      {children}
    </div>
  );
}
