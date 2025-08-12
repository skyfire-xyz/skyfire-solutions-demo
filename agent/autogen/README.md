# Data Analyst Autogen Agent

This application is designed to demonstrate end-to-end commerce flows using Skyfire technologies. It features a prompt-based AI agent interface that interacts with services via the Model Context Protocol (MCP) to simulate tool discovery, tool installation, and using the tools leveraging Autogen.

The agent is tasked with -
```
Find a dataset for pickup truck sales in US in the year 2024. Proceed with purchasing dataset and finally retrieve the contents and summarize the dataset before making a presentation.
``` 

## Contents: 

- MCP Servers:
The following MCP servers are based on the SSE transport protocol.
1. Skyfire Identity & Payment MCP Server
2. CarbonArc MCP Server
3. Reporting MCP Server

- Data Analyst Autogen Agent

## Installation

1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2. Setup OpenAI account and get API key for LLM
3. Follow the [Skyfire Platform Setup Guide](https://docs.skyfire.xyz/docs/introduction) to create Skyfire API key, complete Buyer and Seller Onboarding.
4. Set up environment variables:
    Create a `.env` file in the root directory. You can copy `.env.example` if one exists, or add the necessary variables manually.

    ```
    # .env
    SKYFIRE_MCP_SERVER_URL=
    SKYFIRE_API_KEY=
    REPORTING_MCP_SERVER_URL=
    OPENAI_API_KEY=
    ```

## Getting Started

Run the main implementation:
```bash
python agent.py
```