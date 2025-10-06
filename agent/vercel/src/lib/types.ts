import { z } from "zod";
import { CoreMessage } from "ai";

export type AppContextType = {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  agentContext: AgentContext;
  setAgentContext: (agentContext: AgentContext) => void;
};

export type AgentPattern =
  | "sequential"
  | "routing"
  | "parallel"
  | "orchestrator"
  | "evaluator";

export interface InputField {
  name: string;
  type: "textarea" | "input";
  label: string;
  placeholder: string;
}

export interface AgentContext {
  available_mcp_servers: {url: string, headers: Record<string, string>}[], 
  dynamically_mounted_server: {url: string, headers: Record<string, string>}[],
  conversation_history: CoreMessage[]
} 

export interface AgentType {
  name: string;
  id: string;
  description: string;
  input: string;
  output: string;
  parameter: string;
  context: string;
  inputFields: InputField[];
  resultTabs: string[];
  tools?: Array<{ name: string; description: string }>;
  steps?: string[];
  routes?: string[];
  workers?: string[];
  phases?: string[];
  maxIterations?: number;
  averageTime?: number;
  capabilities?: string[];
}

export interface AgentConfig {
  pattern: AgentPattern;
  maxSteps: number;
  model: string;
  temperature: number;
}

export interface AgentResult {
  text: string;
  steps: AgentStep[];
  toolCalls: ToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AgentStep {
  text: string;
  toolCalls?: ToolCall[];
  toolResults?: unknown[];
  finishReason: string;
}

export interface ModelParams {
  modelId: string;
  maxTokens: number;
  temperature: number;
}

export interface ToolCall {
  type: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export type AgentResponse = string | { images: unknown[]; error: Error };

export type ExamplePrompt = {
  label?: string;
  prompt?: string;
  content?: string;
  query?: string;
  requirements?: string;
  [key: string]: string | undefined;
};

export const agentConfigSchema = z.object({
  pattern: z.enum([
    "sequential",
    "routing",
    "parallel",
    "orchestrator",
    "evaluator",
  ]),
  maxSteps: z.number().min(1).max(20),
  model: z.string(),
  temperature: z.number().min(0).max(2),
});

export const agentResultSchema = z.object({
  text: z.string(),
  steps: z.array(
    z.object({
      text: z.string(),
      toolCalls: z
        .array(
          z.object({
            type: z.string(),
            name: z.string(),
            parameters: z.record(z.unknown()),
            result: z.unknown().optional(),
          })
        )
        .optional(),
      toolResults: z.array(z.unknown()).optional(),
      finishReason: z.string(),
    })
  ),
  toolCalls: z.array(
    z.object({
      type: z.string(),
      name: z.string(),
      parameters: z.record(z.unknown()),
      result: z.unknown().optional(),
    })
  ),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
});

export const agentTypes = [
  {
    name: "Data Commerce Transaction - Agent built on Vercel",
    id: "multi-step-tool-usage",
    description:
      "An autonomous agent designed for secure B2B data commerce. It discovers data sellers, verifies offerings, handles authentication (including Skyfire KYA tokens), executes payments via Skyfire, retrieves data, and can integrate it into analyses or reports. Leverages MCP for communication.",
    input: "Detailed problem description in natural language",
    output:
      "Comprehensive solution with step-by-step breakdown, tool usage analysis, and final results",
    parameter: "maxSteps (default: 5, range: 3-10)",
    context:
      "Perfect for complex scenarios requiring systematic breakdown and specialized tools",
    inputFields: [
      {
        name: "prompt",
        type: "textarea" as const,
        label: "Purchase Intent",
        placeholder: ``, 
        // Describe your purchase in detail. The agent will discover products and services from vendors, finding the right items that match your criteria and handle the transaction securely.\n\nExample purchases:\n\n1. Data Analysis:\n   "I need market research data for the electric vehicle industry in Europe:\n   - Time period: Last 5 years\n   - Geographic focus: Germany, France, UK\n   - Data points: Sales volumes, market share, pricing trends\n   - Format: CSV or Excel\n   - Budget: $2,500"\n\n2. API Access:\n   "Looking for real-time weather data API:\n   - Global coverage required\n   - Update frequency: Every 15 minutes\n   - Historical data: 5 years\n   - SLA: 99.9% uptime\n   - Budget: $1,000/month"\n\n3. Business Intelligence:\n   "Seeking competitive intelligence data for retail sector:\n   - Competitor pricing and promotions\n   - Store location analytics\n   - Customer demographic insights\n   - Data refresh: Weekly\n   - Budget: $5,000"
      },
    ],
    resultTabs: ["response", "steps", "tools"],
    tools: [
      {
        name: "skyfire-identity-payment",
        description: "Skyfire Identity & Payment MCP Server",
      },
      {
        name: "dappier-seller",
        description: "Dappier MCP Server",
      },
    ],
    capabilities: [
      "Agent-to-agent commerce",
      "Data discovery (via Seller API)",
      "Data purchasing",
      "Skyfire payment execution (v1 & v2)",
      "Skyfire KYA token usage (v2+)",
      "MCP client communication",
      "Interaction with remote Seller APIs",
      "Secure file download and extraction",
      "Data integration into documents/presentations",
      "Automated multi-step workflow execution",
      "Credential management (API Keys, potentially username/password, OAuth)",
      "Transaction tracking",
      "Account creation via Seller API (v3+)",
    ],
    steps: [
      "Parse Task & Plan Execution",
      "Discover Seller & Service (via Search or Config)",
      "Identify Dataset & Get Pricing (via Seller API)",
      "Perform Authentication/Verification (Skyfire KYA, Login - as needed)",
      "Check Funds / Prepare Payment (via Skyfire API)",
      "Execute Purchase & Payment (via Seller & Skyfire APIs)",
      "Retrieve & Process Data (Download, Unzip)",
      "Integrate Data / Update Output (e.g., Presentation)",
      "Report Completion & Results",
    ],
    averageTime: 60,
  },
] as const satisfies AgentType[];

export const examplePrompts = {
  "multi-step-tool-usage": [
    {
      label: `Buy-only`,
      prompt: `Find a dataset for pickup truck sales in US in the year 2024. If dataset cost is under my budget of $0.005 then proceed with purchasing and downloading the dataset.`,
    },
    {
      label: `Find-only`,
      prompt: `Find a dataset for pickup truck sales in US in the year 2024.`,
    },
    {
      label: `Buy and present`,
      prompt: `Find a dataset for pickup truck sales in US in the year 2024. If dataset cost is under my budget of $0.005 then proceed with purchasing dataset and finally retrieve the contents and summarize the dataset before making a presentation.`,
    },
  ],
};
