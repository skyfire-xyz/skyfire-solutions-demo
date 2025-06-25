import { type FC } from "react";
import NumberFlow from "@number-flow/react";

import { cn } from "@/lib/utils";

interface TokenCounterProps {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  className?: string;
}

export const TokenCounter: FC<TokenCounterProps> = ({
  promptTokens,
  completionTokens,
  totalTokens,
  className,
}) => {
  return (
    <div className={cn("flex items-center  gap-3 ", className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-neutral-500">Prompt</span>
          <span className="font-mono text-[10px] font-medium text-neutral-700">
            <NumberFlow value={promptTokens} />
          </span>
        </div>
        <div className="flex items-center gap-1 pl-2">
          <span className="text-[10px] text-neutral-500">Completion</span>
          <span className="font-mono text-[10px] font-medium text-neutral-700">
            <NumberFlow value={completionTokens} />
          </span>
        </div>
        <div className="flex items-center gap-1 pl-2">
          <TokenCircleIcon className=" h-4 w-4" />

          <span className="text-[10px] text-neutral-500 font-semibold">
            Total
          </span>
          <span className="font-mono text-[10px]  text-neutral-800 font-semibold">
            <NumberFlow value={totalTokens} />
          </span>
        </div>
      </div>
    </div>
  );
};

const TokenCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    color={"#000000"}
    fill={"none"}
    {...props}
  >
    <path
      opacity="0.4"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM13.0837 8.23082L12.4616 7.2534C12.2466 6.91553 11.7534 6.91553 11.5384 7.2534L10.9163 8.23082C10.2284 9.3117 9.3117 10.2284 8.23082 10.9163L7.2534 11.5384C6.91553 11.7534 6.91553 12.2466 7.2534 12.4616L8.23082 13.0837C9.3117 13.7716 10.2284 14.6883 10.9163 15.7692L11.5384 16.7466C11.7534 17.0845 12.2466 17.0845 12.4616 16.7466L13.0837 15.7692C13.7716 14.6883 14.6883 13.7716 15.7692 13.0837L16.7466 12.4616C17.0845 12.2466 17.0845 11.7534 16.7466 11.5384L15.7692 10.9163C14.6883 10.2284 13.7716 9.3117 13.0837 8.23082Z"
      fill="currentColor"
    />
    <path
      d="M11.5384 7.2534C11.7534 6.91553 12.2466 6.91553 12.4616 7.2534L13.0837 8.23082C13.7716 9.3117 14.6883 10.2284 15.7692 10.9163L16.7466 11.5384C17.0845 11.7534 17.0845 12.2466 16.7466 12.4616L15.7692 13.0837C14.6883 13.7716 13.7716 14.6883 13.0837 15.7692L12.4616 16.7466C12.2466 17.0845 11.7534 17.0845 11.5384 16.7466L10.9163 15.7692C10.2284 14.6883 9.3117 13.7716 8.23082 13.0837L7.2534 12.4616C6.91553 12.2466 6.91553 11.7534 7.2534 11.5384L8.23082 10.9163C9.3117 10.2284 10.2284 9.3117 10.9163 8.23082L11.5384 7.2534Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);
