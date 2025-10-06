"use client";

import { toast } from "sonner";
import { useState, useCallback } from "react";

import {
  ActionButtons,
  InputPanel,
} from "@/components/agent/agent-input-panel";
import { AgentHeader } from "@/components/agent/agent-header";
import { OutputPanel } from "@/components/agent/agent-output-panel";
import { MobileOutputPanel } from "@/components/agent/agent-mobile-output-panel";

import { getAgent } from "@/app/actions";
import { useApp } from "@/context/app-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { agentTypes, examplePrompts, ExamplePrompt } from "@/lib/types";

export function AgentSandbox() {
  const [inputs, setInputs] = useState<Record<string, string>>({"prompt": examplePrompts["multi-step-tool-usage"][0].prompt});
  const [selectedExampleIndex, setSelectedExampleIndex] = useState<
    number | null
  >(0);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedOutput, setParsedOutput] = useState<unknown>(null);
  const [selectedAgent, setSelectedAgent] = useState<
    (typeof agentTypes)[number]["id"]
  >(agentTypes[0].id);
  const [inputHistory, setInputHistory] = useState<Record<string, string[]>>(
    {}
  );
  const [outputDrawerOpen, setOutputDrawerOpen] = useState(false);
  // const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const { apiKey, agentContext, setAgentContext } = useApp();

  const isMobile = useMediaQuery("(max-width: 768px)");
  const selectedAgentDetails = agentTypes.find(
    (agent) => agent.id === selectedAgent
  );
  const currentAgentHistory = inputHistory[selectedAgent] || [];

  const handleInputChange = (fieldName: string, value: string) => {
    setInputs((prev) => ({ ...prev, [fieldName]: value }));
  };

  const resetState = useCallback(() => {
    setInputs({});
    setOutput("");
    setLoading(false);
    setParsedOutput(null);
    setSelectedExampleIndex(null);
    setSelectedAgent(agentTypes[0].id);
  }, []);

  const handleExampleSelect = (example: ExamplePrompt, index: number) => {
    const definedInputs = Object.entries(example)
      .filter(([, value]) => value !== undefined)
      .reduce((acc, [key, value]) => {
        acc[key] = value as string; // Assert value is string after filtering undefined
        return acc;
      }, {} as Record<string, string>);
    setInputs(definedInputs);
    setSelectedExampleIndex(index);
  };

  const handleHistorySelect = (historyItem: string) => {
    try {
      const parsedItem = JSON.parse(historyItem) as Record<string, string>;
      setInputs(parsedItem);
      toast.success("Loaded from history");
    } catch (error) {
      toast.error(`Failed to load history item: ${error}`);
    }
  };

  const handleInputSubmit = async () => {
    if (!selectedAgentDetails) return;

    if (Object.values(inputs).every((v) => v.trim() === "")) {
      toast.error("Please enter an input or select an example");
      return;
    }

    // if (!apiKey) {
    //   setSecretDialogOpen(true);
    //   return;
    // }

    setLoading(true);
    setOutputDrawerOpen(true);

    try {
      const result = await getAgent(apiKey, inputs, agentContext);
      if (typeof result === "string") {
        setOutput(result);

        try {
          setParsedOutput(JSON.parse(result));
          setAgentContext(JSON.parse(result).agentContext);
        } catch {
          setParsedOutput(null);
        }
      } else {
        setOutput(result || "Unknown error");
        toast.error(result || "Unknown error");
        setParsedOutput({
          error: true,
          message: result || "Unknown error",
        });
      }

      setInputHistory((prev) => ({
        ...prev,
        [selectedAgent]: [
          JSON.stringify(inputs),
          ...(prev[selectedAgent] || []),
        ],
      }));
    } catch (error) {
      toast.error(`Failed to process request: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileReOpenOutputDrawer = () => {
    if (!outputDrawerOpen && parsedOutput) {
      setOutputDrawerOpen(true);
    }
  };

  // useEffect(() => {
  //   if (!apiKey) {
  //     setSecretDialogOpen(true);
  //   }
  // }, [apiKey]);

  return (
    <div className="flex flex-col h-screen overflow-x-hidden">
      <AgentHeader />
      
      <div className="flex-1 flex flex-col min-h-0 pb-4 bg-muted overflow-hidden relative">
        {/* <SecretDialog
          open={secretDialogOpen}
          onOpenChange={setSecretDialogOpen}
        /> */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 w-[calc(80vw-1rem)] lg:w-full py-2">
          {selectedAgentDetails && (
            <InputPanel
              inputs={inputs}
              resetState={resetState}
              onInputChange={handleInputChange}
              selectedAgent={selectedAgentDetails}
              onExampleSelect={handleExampleSelect}
              selectedExampleIndex={selectedExampleIndex ?? -1}
              examplePrompts={
                examplePrompts[selectedAgent as keyof typeof examplePrompts] ||
                []
              }
            >
              <ActionButtons
                inputs={inputs}
                loading={loading}
                isMobile={isMobile}
                resetState={resetState}
                inputHistory={currentAgentHistory}
                handleInputSubmit={handleInputSubmit}
                handleHistorySelect={handleHistorySelect}
                mobileReOpenOutputDrawer={handleMobileReOpenOutputDrawer}
              />
            </InputPanel>
          )}

          {isMobile ? (
            <MobileOutputPanel
              selectedAgent={selectedAgentDetails!}
              loading={loading}
              outputDrawerOpen={outputDrawerOpen}
              setOutputDrawerOpen={setOutputDrawerOpen}
            >
              <OutputPanel
                selectedAgent={selectedAgentDetails!}
                loading={loading}
                output={output}
                parsedOutput={parsedOutput}
              />
            </MobileOutputPanel>
          ) : (
            <OutputPanel
              selectedAgent={selectedAgentDetails!}
              loading={loading}
              output={output}
              parsedOutput={parsedOutput}
            />
          )}
        </div>
      </div>
    </div>
  );
}
