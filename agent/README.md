# Data Analyst Agent implementation in various platforms 

1. [Vercel (TypeScript)](https://github.com/skyfire-xyz/skyfire-solutions-demo/tree/main/agent/vercel)
2. [Autogen (Python)](https://github.com/skyfire-xyz/skyfire-solutions-demo/tree/main/agent/autogen)
2. [Strands (Python)](https://github.com/skyfire-xyz/skyfire-solutions-demo/tree/main/agent/strands)


## Data Analyst Agent Background

This application is designed to demonstrate end-to-end commerce flows using Skyfire technologies. It features a prompt-based AI agent interface that interacts with services via the Model Context Protocol (MCP) to simulate tool discovery, tool installation, and tool usage leveraging different agentic frameworks.

The agent is tasked with:
```
Find a dataset for pickup truck sales in US in the year 2024. Proceed with purchasing dataset and finally retrieve the contents and summarize the dataset before making a presentation.
```

## MCP Servers Required

- **MCP Servers** (SSE transport protocol):
  - Skyfire Identity & Payment MCP Server
  - Dappier MCP Server
  - Reporting MCP Server


