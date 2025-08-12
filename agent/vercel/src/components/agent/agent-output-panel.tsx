/* eslint-disable */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TokenCounter } from "@/components/token-counter";
import { MemoizedReactMarkdown } from "@/components/markdown-renderer";
import { CompletionIndicator } from "@/components/completion-indicator";
import { AgentOutputCards } from "@/components/agent/agent-output-cards";
import { Countdown, LoadingState } from "@/components/agent/agent-states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { type AgentType } from "@/lib/types";
import { cn, formatJSONString } from "@/lib/utils";
import { slideInFromRight } from "@/lib/animations";

interface OutputPanelProps {
  selectedAgent: AgentType;
  loading: boolean;
  output: string;
  parsedOutput: any;
}

interface TabContentProps {
  parsedOutput: any;
}

function ResponseTab({ parsedOutput }: TabContentProps) {
  return (
    <TabsContent value="response" className="mt-4 space-y-4">
      <Card className="p-4">
        <CompletionIndicator
          status={parsedOutput.error ? "error" : "success"}
          message={
            parsedOutput.text ||
            parsedOutput.response ||
            parsedOutput.finalOutput ||
            parsedOutput.output
          }
          className="mb-4"
        />
        <div className="max-w-full overflow-x-auto">
          <MemoizedReactMarkdown>
            {formatJSONString(
              parsedOutput.text ||
                parsedOutput.response ||
                parsedOutput.finalOutput ||
                parsedOutput.output
            )}
          </MemoizedReactMarkdown>
        </div>
      </Card>
    </TabsContent>
  );
}

function StepsTab({ parsedOutput }: TabContentProps) {
  if (!parsedOutput.steps?.length) return null;
  return (
    <TabsContent value="steps" className="mt-4 space-y-4">
      {parsedOutput.steps.map((step: any, index: number) => (
        <Card key={index} className="p-4">
          <CompletionIndicator
            status="success"
            message={`${step.step || `Step ${index + 1}`}: ${
              step.output ? "completed" : "success"
            }`}
            className="mb-2"
          />
          <MemoizedReactMarkdown>
            {step.output || step.result || step.text}
          </MemoizedReactMarkdown>
        </Card>
      ))}
    </TabsContent>
  );
}

function ClassificationTab({ parsedOutput }: TabContentProps) {
  if (!parsedOutput.classification) return null;
  return (
    <TabsContent value="classification" className="mt-4 space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Query Classification</h4>
            <Badge className="mb-2">{parsedOutput.classification.type}</Badge>
            <p className="text-sm text-neutral-600">
              {parsedOutput.classification.reasoning}
            </p>
          </div>
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Routed Response</h4>
            <MemoizedReactMarkdown>
              {parsedOutput.response}
            </MemoizedReactMarkdown>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
}

function ToolsTab({ parsedOutput }: TabContentProps) {
  if (!parsedOutput.toolCalls?.length) return null;
  return (
    <TabsContent value="tools" className="mt-4 space-y-4">
      {parsedOutput.toolCalls.map((tool: any, index: number) => (
        <Card key={index} className="p-4">
          <CompletionIndicator
            status="success"
            message={`${tool.name || `Tool ${index + 1}`}`}
            className="mb-2"
          />
          <div className="space-y-2">
            <div className="text-sm text-neutral-600">
              <MemoizedReactMarkdown>
                {tool.input || tool.args || tool.parameters}
              </MemoizedReactMarkdown>
            </div>
            {tool.output && (
              <div className="pt-2 border-t">
                <h4 className="text-xs font-medium mb-1">Output</h4>
                <MemoizedReactMarkdown>{tool.output}</MemoizedReactMarkdown>
              </div>
            )}
          </div>
        </Card>
      ))}
    </TabsContent>
  );
}

function IterationsTab({ parsedOutput }: TabContentProps) {
  if (!parsedOutput.iterations?.length) return null;
  return (
    <TabsContent value="iterations" className="mt-4 space-y-4">
      {parsedOutput.iterations.map((iteration: any, index: number) => (
        <Card key={index} className="p-4">
          <CompletionIndicator
            status="success"
            message={`Iteration ${index + 1}`}
            className="mb-2"
          />
          <div className="space-y-2">
            <MemoizedReactMarkdown>
              {iteration.output || iteration.result || iteration.text}
            </MemoizedReactMarkdown>
          </div>
        </Card>
      ))}
    </TabsContent>
  );
}

export function OutputPanel({
  selectedAgent,
  loading,
  output,
  parsedOutput,
}: OutputPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [milliseconds, setMilliseconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let msTimer: NodeJS.Timeout;

    if (loading) {
      setElapsedTime(0);
      setMilliseconds(0);
      timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
      msTimer = setInterval(
        () => setMilliseconds((prev) => (prev + 10) % 1000),
        10
      );
    }

    return () => {
      if (timer) clearInterval(timer);
      if (msTimer) clearInterval(msTimer);
    };
  }, [loading]);

  const renderCustomOutput = () => {
    const AgentOutput =
      AgentOutputCards[selectedAgent.id as keyof typeof AgentOutputCards]
        ?.renderOutput;
    if (AgentOutput && parsedOutput) {
      return (
        <div className="space-y-4 max-w-full">
          <div className="max-w-full overflow-x-auto">
            <AgentOutput {...parsedOutput} />
          </div>
        </div>
      );
    }
    return null;
  };

  const renderTabs = () => {
    if (!output) return null;

    const customOutput = renderCustomOutput();
    if (customOutput) return customOutput;

    const availableTabs = selectedAgent.resultTabs || ["response"];

    return (
      <Tabs defaultValue="response" className="w-full">
        <TabsList
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)`,
          }}
        >
          {availableTabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              disabled={
                (tab === "steps" && !parsedOutput.steps?.length) ||
                (tab === "tools" && !parsedOutput.toolCalls?.length) ||
                (tab === "iterations" && !parsedOutput.iterations?.length)
              }
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="mt-4 space-y-4">
          <ResponseTab parsedOutput={parsedOutput} />
          <StepsTab parsedOutput={parsedOutput} />
          <ClassificationTab parsedOutput={parsedOutput} />
          <ToolsTab parsedOutput={parsedOutput} />
          <IterationsTab parsedOutput={parsedOutput} />
        </div>
      </Tabs>
    );
  };

  return (
    <motion.div
      variants={slideInFromRight}
      className={cn(
        "flex flex-col min-h-0 overflow-hidden bg-muted",
        "h-full w-full",
        "md:w-1/2 lg:w-4/5"
      )}
    >
      {/* Header with Indicators */}
      <div className="flex-none flex items-center justify-between w-full px-4 py-2 border-b border-border/50">
        {!loading && parsedOutput && (
          <CompletionIndicator
            status={parsedOutput?.error ? "error" : "success"}
            message={
              parsedOutput?.error
                ? `Failed to process request ${parsedOutput?.message}`
                : "Tokens"
            }
            className="hidden md:flex items-center mb-0"
          >
            <AnimatePresence mode="wait">
              {parsedOutput?.usage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TokenCounter
                    promptTokens={parsedOutput?.usage?.promptTokens}
                    completionTokens={parsedOutput?.usage?.completionTokens}
                    totalTokens={parsedOutput?.usage?.totalTokens}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </CompletionIndicator>
        )}

        {(loading || output) && (
          <Countdown
            seconds={elapsedTime}
            milliseconds={loading ? milliseconds : 0}
            loading={loading}
          />
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col">
              <LoadingState agent={selectedAgent} elapsedTime={elapsedTime} />
            </div>
          ) : output ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 pb-16"
            >
              {renderTabs()}
            </motion.div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
