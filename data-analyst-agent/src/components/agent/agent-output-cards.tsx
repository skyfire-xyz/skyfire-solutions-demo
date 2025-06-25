/* eslint-disable */

"use client";

import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MemoizedReactMarkdown } from "@/components/markdown-renderer";

import { cn } from "@/lib/utils";
import "../../styles/styles.css";

function formatMarkdownContent(content: any): string {
  if (content == null || content == undefined) return "";
  if (typeof content === "string") return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}

export const AgentOutputCards = {
  "multi-step-tool-usage": {
    renderOutput: (output: any) => (
      <div className="space-y-4 p-1">
        <AnimatePresence mode="wait">
          {(output.steps || []).map((step: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-4 relative overflow-hidden overflow-x-scroll rounded-2xl transition-all duration-300 border-none shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] ">
                <motion.div
                  className="absolute top-0 left-0 w-1 h-full bg-blue-500"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                />
                <div className="ml-2">
                  {step.tool !== "thinking" ? (
                    <>
                      <MemoizedReactMarkdown>
                        {formatMarkdownContent(step.text)}
                      </MemoizedReactMarkdown>
                      <br></br>
                    </>
                  ) : (
                    <></>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        delay: index * 0.1,
                      }}
                    >
                      <Badge
                        variant="outline"
                        className="transition-colors"
                      >{`Step ${index + 1}`}</Badge>
                    </motion.div>
                    {step.tool && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                      >
                        <Badge variant="secondary" className="text-xs">
                          {step.tool}
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {step.tool === "thinking" ? (
                      <MemoizedReactMarkdown>
                        {formatMarkdownContent(step.text)}
                      </MemoizedReactMarkdown>
                    ) : (
                      <></>
                    )}
                    {step.result && (
                      <div className="mt-2 pt-2 border-t text-sm">
                        <div className="text-sm font-medium text-neutral-600 mb-1">
                          Request:
                        </div>
                        <pre>{formatMarkdownContent(step.result.args)}</pre>
                        <div className="text-sm font-medium text-neutral-600 mb-1">
                          Response:
                        </div>
                        {/* <MemoizedReactMarkdown> */}
                        <pre className="overflow-x-scroll">
                          {formatMarkdownContent(step.result.result?.content)}
                        </pre>
                        {/* </MemoizedReactMarkdown> */}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    ),
  },

  "sequential-processing": {
    renderOutput: (output: any) => (
      <div className="space-y-4 p-1">
        <AnimatePresence>
          {output.steps?.map((step: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.2 }}
            >
              <Card className="p-4  transition-all duration-200 rounded-2xl border-none shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] ">
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className={cn("transition-colors", {
                      "bg-blue-50 border-blue-200 hover:bg-blue-100":
                        index === 0,
                      "bg-green-50 border-green-200 hover:bg-green-100":
                        index === 1,
                      "bg-purple-50 border-purple-200 hover:bg-purple-100":
                        index === 2,
                    })}
                  >
                    {step.step}
                  </Badge>
                  <motion.div
                    className="flex-1 h-1 bg-neutral-100 rounded overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className={cn("h-1 rounded", {
                        "bg-blue-500": index === 0,
                        "bg-green-500": index === 1,
                        "bg-purple-500": index === 2,
                      })}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.8 }}
                    />
                  </motion.div>
                </div>
                <MemoizedReactMarkdown>
                  {formatMarkdownContent(step.output)}
                </MemoizedReactMarkdown>
              </Card>
            </motion.div>
          ))}
          {output.finalOutput && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: (output.steps?.length || 0) * 0.2,
              }}
              className="prose prose-sm dark:prose-invert max-w-none  rounded-[1.25rem] p-1 shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] "
            >
              <Card className="p-4  transition-all duration-200 rounded-2xl border-none shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] ">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">Final Output</Badge>
                </div>
                <MemoizedReactMarkdown>
                  {formatMarkdownContent(output.finalOutput)}
                </MemoizedReactMarkdown>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ),
  },

  routing: {
    renderOutput: (output: any) => (
      <div className="space-y-4 p-1">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4 rounded-2xl transition-all duration-300 border-none shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] ">
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Badge
                    variant="outline"
                    className={cn("transition-colors", {
                      "bg-blue-50 border-blue-200":
                        output.classification?.type === "general",
                      "bg-green-50 border-green-200":
                        output.classification?.type === "technical",
                      "bg-purple-50 border-purple-200":
                        output.classification?.type === "creative",
                    })}
                  >
                    {output.classification?.type || "Processing"}
                  </Badge>
                </motion.div>
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="text-sm text-neutral-600"
                >
                  {output.classification?.reasoning || "Analyzing query..."}
                </motion.div>
              </div>
              <motion.div
                className="border-t pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <div className="text-sm text-neutral-600  relative group">
                  <MemoizedReactMarkdown>
                    {output.response || output.text || "Processing response..."}
                  </MemoizedReactMarkdown>
                </div>
              </motion.div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    ),
  },

  "parallel-processing": {
    renderOutput: (output: any) => (
      <div className="space-y-4 p-1">
        <AnimatePresence mode="wait">
          {output.results?.map((result: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.15 }}
            >
              <Card className="p-4 rounded-2xl transition-all duration-300 border-none shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] ">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      delay: index * 0.1,
                    }}
                  >
                    <Badge
                      variant="outline"
                      className={cn("transition-colors", {
                        "bg-blue-50 border-blue-200": index === 0,
                        "bg-green-50 border-green-200": index === 1,
                        "bg-purple-50 border-purple-200": index === 2,
                      })}
                    >
                      {result.task || `Worker ${index + 1}`}
                    </Badge>
                  </motion.div>
                </div>
                <motion.div
                  className="text-sm text-neutral-600  relative group"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.15 + 0.2 }}
                >
                  <MemoizedReactMarkdown>
                    {result.result || result.output || result.text}
                  </MemoizedReactMarkdown>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    ),
  },

  "orchestrator-worker": {
    renderOutput: (output: any) => (
      <div className="space-y-4 p-1">
        <Card className="p-4 rounded-2xl border-none shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] ">
          <h3 className="text-sm font-medium mb-3">Task Breakdown</h3>
          <div className="space-y-3">
            {output.plan?.tasks.map((task: any, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <Badge variant="outline">{index + 1}</Badge>
                <div>
                  <div className="font-medium text-sm">{task.name}</div>
                  <div className="text-sm text-neutral-600">
                    {task.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="grid gap-4">
          {output.results?.map((result: any, index: number) => (
            <Card key={index} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge>{result.task}</Badge>
                <Badge variant="outline">Worker {index + 1}</Badge>
              </div>
              <MemoizedReactMarkdown>{result.result}</MemoizedReactMarkdown>
            </Card>
          ))}
        </div>
      </div>
    ),
  },

  "evaluator-optimizer": {
    renderOutput: (output: any) => (
      <div className="space-y-4 p-1">
        <AnimatePresence mode="wait">
          {output.iterations?.map((iteration: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.15 }}
            >
              <Card className="p-4 rounded-2xl transition-all duration-300 border-none shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] ">
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.15 + 0.2 }}
                  >
                    <Badge variant="outline">
                      Iteration {iteration.iteration}
                    </Badge>
                  </motion.div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.15 + 0.3 }}
                      className="text-xs text-neutral-500"
                    >
                      Quality:
                    </motion.div>
                    <motion.div
                      className="w-24 h-2 bg-neutral-100 rounded overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: "96px" }}
                      transition={{ duration: 0.5, delay: index * 0.15 + 0.4 }}
                    >
                      <motion.div
                        className={cn("h-2 rounded transition-all", {
                          "bg-red-500": iteration.evaluation.quality < 5,
                          "bg-yellow-500":
                            iteration.evaluation.quality >= 5 &&
                            iteration.evaluation.quality < 8,
                          "bg-green-500": iteration.evaluation.quality >= 8,
                        })}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            (iteration.evaluation.quality / 10) * 100
                          }%`,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: index * 0.15 + 0.5,
                        }}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.15 + 0.6 }}
                      className="text-xs font-medium"
                    >
                      {iteration.evaluation.quality}/10
                    </motion.div>
                  </div>
                </div>
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.15 + 0.7 }}
                >
                  <div
                    className={cn(
                      "shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] p-4  rounded-xl",
                      {
                        "bg-red-50/30": iteration.evaluation.quality < 5,
                        "bg-yellow-50/30":
                          iteration.evaluation.quality >= 5 &&
                          iteration.evaluation.quality < 8,
                        "bg-green-50/30": iteration.evaluation.quality >= 8,
                      }
                    )}
                  >
                    <Badge variant="outline">
                      Iteration {iteration.iteration} Feedback:
                    </Badge>

                    <MemoizedReactMarkdown>
                      {iteration.evaluation.feedback}
                    </MemoizedReactMarkdown>
                  </div>
                  <motion.div
                    className="pt-3 "
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.15 + 0.8 }}
                  >
                    <div
                      className={cn(
                        "shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] p-4  rounded-xl",
                        {
                          "bg-red-50/30": iteration.evaluation.quality < 5,
                          "bg-yellow-50/30":
                            iteration.evaluation.quality >= 5 &&
                            iteration.evaluation.quality < 8,
                          "bg-green-50/30": iteration.evaluation.quality >= 8,
                        }
                      )}
                    >
                      <div className="text-xs font-bold uppercase font-mono text-neutral-500 mb-1"></div>
                      <Badge variant="outline">
                        Iteration {iteration.iteration} Output:
                      </Badge>
                      <div className="text-sm text-neutral-600  relative group">
                        <MemoizedReactMarkdown>
                          {iteration.output}
                        </MemoizedReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    ),
  },
};
