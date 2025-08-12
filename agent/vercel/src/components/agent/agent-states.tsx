import { motion } from "motion/react";
import { Clock, Sparkles } from "lucide-react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TextRoll, TextEffect } from "@/components/effects";

import {
  pulseVariants,
  staggerContainerVariants,
  staggerItemVariants,
  fadeIn,
  fadeInScale,
  springTransition,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import { type AgentType } from "@/lib/types";

function LoadingState({
  agent,
  elapsedTime = 0,
}: {
  agent: AgentType;
  elapsedTime?: number;
}) {
  const progress = Math.min(
    (elapsedTime / (agent.averageTime || 30)) * 100,
    100
  );

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: {
            duration: 0.4,
            ease: [0.32, 0.72, 0, 1],
            when: "beforeChildren",
            staggerChildren: 0.1,
          },
        },
        exit: {
          opacity: 0,
          transition: {
            duration: 0.2,
            ease: [0.32, 0.72, 0, 1],
            when: "afterChildren",
            staggerChildren: 0.05,
            staggerDirection: -1,
          },
        },
      }}
      className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center"
    >
      <div className="max-w-2xl w-full space-y-8">
        {/* Header Section */}
        <motion.div variants={staggerItemVariants} className="space-y-1">
          <div className="space-y-1">
            <motion.h3
              variants={fadeIn}
              className="bg-blue-600 mb-1 mx-auto w-fit text-white text-[10px] font-medium px-1.5 tracking-wide rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.15),_inset_0_1px_0.5px_rgba(255,255,255,0.2),_0_-0.5px_1px_rgba(0,0,0,0.08)_inset,_0_0_0_1px_rgba(0,0,0,0.08)_inset] relative"
            />
            <TextRoll className="text-lg lg:text-3xl font-bold">{`${agent.name}`}</TextRoll>
          </div>
          {/* Tools & Time */}
          <motion.div
            className="inline-flex items-center gap-3  text-xs font-medium  min-w-24 border border-blue-100 p-1 px-1.5 rounded-full"
            whileHover={{ y: -2 }}
            transition={springTransition}
          >
            <CircularProgress size={30} strokeWidth={2} progress={progress}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="size-5 text-blue-600"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                  <motion.path
                    d="M12 4.75v1.5M17.127 6.873l-1.061 1.061M19.25 12h-1.5M17.127 17.127l-1.061-1.061M12 17.75v1.5M7.873 17.127l1.061-1.061M4.75 12h1.5M7.873 6.873l1.061 1.061"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 1.5,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }}
                  />
                </svg>
              </motion.div>
            </CircularProgress>
            <div className=" text-sm font-medium text-blue-600">
              {Math.round(progress)}%
            </div>

            <span className="text-sm font-medium text-neutral-800">
              Estimated Time
            </span>
            <div className="w-1 h-1 rounded-full bg-blue-200" />
            <span className="text-sm text-blue-600 flex items-center font-medium">
              <Clock className="w-4 h-4 mr-1.5 text-blue-500" />
              {agent.averageTime}s
            </span>
          </motion.div>
        </motion.div>

        {/* Progress Section */}
        <motion.div variants={staggerItemVariants} className="w-full">
          <motion.div
            variants={fadeInScale}
            className="rounded-2xl bg-white/95 border border-neutral-100/80 shadow-sm
              hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            {/* Card Header */}
            <div className="px-4 sm:px-6 py-3 border-b border-neutral-100 bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <div className="text-xs sm:text-sm font-medium text-neutral-700">
                  Agent Details
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 sm:p-6 text-left">
              <motion.div
                variants={staggerContainerVariants}
                initial="initial"
                animate="animate"
                className="space-y-6"
              >
                {agent.description && (
                  <motion.div
                    variants={staggerItemVariants}
                    className="space-y-2"
                  >
                    <h4 className="text-xs font-medium text-neutral-500">
                      Description
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed ">
                      {agent.description}
                    </p>
                  </motion.div>
                )}

                {agent.capabilities && (
                  <motion.div
                    variants={staggerItemVariants}
                    className="space-y-3"
                  >
                    <h4 className="text-xs font-medium text-neutral-500">
                      Capabilities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {agent.capabilities.map((capability, index) => (
                        <motion.div
                          key={index}
                          variants={staggerItemVariants}
                          className="group flex items-center gap-2 px-2.5 py-1 bg-neutral-50 
                            rounded-full text-xs text-neutral-600 border border-neutral-200/80
                            hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 
                            transition-colors duration-200"
                        >
                          <span className="size-1 rounded-full bg-current" />
                          <span>{capability}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function EmptyState({
  agent,
}: {
  agent: {
    name: string;
    description: string;
    context: string;
    parameter: string;
    inputFields: Array<{
      name: string;
      type: string;
      label: string;
      placeholder: string;
    }>;
    input: string;
    output: string;
    resultTabs?: string[];
    tools?: Array<{ name: string; description: string }>;
    steps?: string[];
    averageTime?: number;
    capabilities?: string[];
  };
}) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: {
            duration: 0.4,
            ease: [0.32, 0.72, 0, 1],
            when: "beforeChildren",
            staggerChildren: 0.1,
          },
        },
        exit: {
          opacity: 0,
          transition: {
            duration: 0.2,
            ease: [0.32, 0.72, 0, 1],
            when: "afterChildren",
            staggerChildren: 0.05,
            staggerDirection: -1,
          },
        },
      }}
    >
      <Card className="mt-1 pt-1 p-0 space-y-8 rounded-2xl border-none shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)]">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div>
                <div className="flex items-center pb-1 gap-2">
                  <div className="bg-blue-600  text-white text-[10px] py-[2px] font-medium px-1.5 tracking-wide rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.15),_inset_0_1px_0.5px_rgba(255,255,255,0.2),_0_-0.5px_1px_rgba(0,0,0,0.08)_inset,_0_0_0_1px_rgba(0,0,0,0.08)_inset] relative">
                    <span className="relative z-10">Agent</span>
                  </div>
                  <div
                    key={agent.name}
                    className="flex items-center gap-1 text-sm font-medium lg:text-xl lg:font-semibold"
                  >
                    <TextEffect>{agent.name}</TextEffect>
                  </div>
                </div>

                {/* Model & Input fields */}
                <div className="  flex items-center gap-1  pl-1    px-[2px] py-[2px] ">
                  <div className="flex items-center space-x-2 text-sm text-neutral-500 ">
                    <div className="flex flex-col bg-neutral-50 px-1 py-[1px]  text-[9px] rounded-sm text-neutral-800 ring-[1px] ring-black/10 ">
                      <div className="flex items-center gap-1">
                        <div className="size-4 rounded-full bg-black flex items-center justify-center">
                          <OpenAIIcon className="size-3 text-white" />
                        </div>
                        <span className="tracking-wide">gpt-4o</span>
                      </div>
                    </div>
                    <div className="  flex items-center gap-1  pl-1   px-[2px] py-[1px] ">
                      <p className="font-medium text-muted-foreground/60 tracking-wide text-[9px]">
                        Input fields
                      </p>
                      <div className="inline-block bg-neutral-50 px-1  text-[9px] rounded-sm text-neutral-800 border border-black/10 ">
                        <NumberFlow value={agent.inputFields.length ?? 0} />
                      </div>
                    </div>

                    <div className="  flex items-center gap-1  pl-1   px-[2px] py-[1px] ">
                      <p className="font-medium text-muted-foreground/60 tracking-wide text-[9px]">
                        Average Loading Time
                      </p>
                      <div className="inline-block bg-neutral-50 px-1  text-[9px] rounded-sm text-neutral-800 border border-black/10 ">
                        <NumberFlow value={agent.averageTime ?? 0} />s
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <motion.p
              key={agent.description}
              variants={staggerItemVariants}
              className="text-sm text-neutral-600  text-pretty lg:pr-6"
            >
              {agent.description}
            </motion.p>
          </div>

          {/* Details */}
          <motion.div
            key={`${agent.name}-details`}
            variants={staggerItemVariants}
            className="space-y-4 text-sm"
          >
            <div className="p-4 bg-neutral-50 rounded-lg shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] space-y-4">
              <div>
                <h4 className="font-medium text-neutral-900 mb-1 text-xs">
                  Best Use Cases
                </h4>
                <p className="text-neutral-600 text-xs">{agent.context}</p>
              </div>
              <div className="space-y-4 pt-4 border-t border-neutral-200">
                <div>
                  <h4 className="font-medium text-neutral-900 mb-2 text-xs">
                    Inputs
                  </h4>
                  <div className="space-y-2 text-xs">
                    {agent.inputFields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-neutral-600"
                      >
                        <Badge variant="outline" className="mt-0.5">
                          {`<${field.type} />`}
                        </Badge>
                        <div>
                          <span className="font-medium">{field.label}</span>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {field.placeholder.split("\n")[0]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-neutral-900 mb-1 text-xs">
                    Output
                  </div>
                  <p className="text-neutral-600 text-xs">{agent.output}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            key={`${agent.name}-features`}
            variants={staggerItemVariants}
            className="space-y-3"
          >
            <h4 className="font-medium text-neutral-900 text-xs">
              Capabilities
            </h4>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities?.map((capability) => (
                <Badge
                  key={capability}
                  variant="secondary"
                  className=" rounded-full shadow-sm border border-black/10 bg-muted"
                >
                  {capability}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}

function CircularProgress({
  progress,
  size = 80,
  strokeWidth = 4,
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex group">
      {/* Background blur effect */}
      <motion.div
        className="absolute -inset-4 bg-blue-500/5 rounded-full blur-lg"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Static circle */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 rounded-full"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(59, 130, 246, 0.1)"
          strokeWidth={strokeWidth}
          className="transition-all duration-300"
        />

        {/* Animated progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] "
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full">
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="rounded-full flex flex-col items-center "
        >
          {children}
          {/* <OpenAIIcon className="size-6  drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" /> */}
        </motion.div>
      </div>
    </div>
  );
}

function Countdown({
  seconds,
  milliseconds,
  loading,
  className,
}: {
  seconds: number;
  milliseconds: number;
  loading?: boolean;
  className?: string;
}) {
  const ss = seconds;
  const ms = Math.floor(milliseconds / 10);

  return (
    <motion.div
      layoutId="countdown"
      key={seconds === 0 ? "countdown-0" : "countdown"}
      className={cn(
        " flex items-center gap-2 text-xs font-medium bg-white/90 px-2.5 py-1.5 rounded-full",
        "shadow-[0_2px_4px_rgba(0,0,0,0.02),_0_1px_2px_rgba(0,0,0,0.04)]",
        "h-7 min-w-24",
        "shadow-[inset_0px_-2.10843px_0px_0px_rgb(244,241,238),_0px_1.20482px_6.3253px_0px_rgb(244,241,238)]",
        "border border-[#E9E3DD] text-[#36322F] ",
        loading ? "text-blue-500" : "text-neutral-500",
        className
      )}
    >
      <Clock02Icon
        className={cn(
          "w-3.5 h-3.5",
          loading && "animate-[spin_3s_linear_infinite]"
        )}
      />
      <NumberFlowGroup>
        <div
          style={{ fontVariantNumeric: "tabular-nums" } as React.CSSProperties}
          className="flex items-baseline font-medium tracking-tight"
        >
          <div className="flex items-baseline gap-[2px]">
            <NumberFlow
              value={ss}
              format={{ minimumIntegerDigits: 2 }}
              className={cn(
                "text-sm transition-colors duration-200",
                loading ? "text-blue-600" : "text-neutral-600"
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium transition-colors duration-200",
                loading ? "text-blue-400" : "text-neutral-400"
              )}
            >
              s
            </span>
          </div>
          <span
            className={cn(
              "mx-0.5 transition-colors duration-200",
              loading ? "text-blue-400/70" : "text-neutral-300"
            )}
          >
            .
          </span>
          <div className="flex items-baseline">
            <NumberFlow
              value={ms}
              format={{ minimumIntegerDigits: 2 }}
              className={cn(
                "text-sm transition-colors duration-200",
                loading ? "text-blue-500" : "text-neutral-500"
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium transition-colors duration-200 ml-0.5",
                loading ? "text-blue-400" : "text-neutral-400"
              )}
            >
              ms
            </span>
          </div>
        </div>
      </NumberFlowGroup>
    </motion.div>
  );
}

function OpenAIIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="256"
      height="260"
      preserveAspectRatio="xMidYMid"
      viewBox="0 0 256 260"
      {...props}
    >
      <path
        className="fill-neutral-200"
        d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"
      />
    </svg>
  );
}

const Clock02Icon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    color={"#000000"}
    fill={"none"}
    {...props}
  >
    <circle opacity="0.4" cx="12" cy="12" r="10" fill="currentColor" />
    <path
      d="M5.04798 8.60657L2.53784 8.45376C4.33712 3.70477 9.503 0.999914 14.5396 2.34474C19.904 3.77711 23.0904 9.26107 21.6565 14.5935C20.2227 19.926 14.7116 23.0876 9.3472 21.6553C5.36419 20.5917 2.58192 17.2946 2 13.4844"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 8V12L14 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export { LoadingState, EmptyState, OpenAIIcon, Countdown };
