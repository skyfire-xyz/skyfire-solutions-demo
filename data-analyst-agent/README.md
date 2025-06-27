# Data Analyst Agent

This application is designed to demonstrate end-to-end commerce flows using Skyfire technologies. It features a prompt-based AI agent interface that interacts with services via the Model Context Protocol (MCP) to simulate tool discovery, tool installation, and using the tools leveraging the Vercel AI SDK.

The agent is tasked with -
```
Purchase a dataset for pickup truck sales
- Time period: 2024
- Geographic focus: US
- Data points: Sales volumes, pricing trends etc
- Format: CSV or Excel
- Budget: $0.005
``` 

## Live Demo Link
This demo agent is available [here](https://data-analyst-agent-demo-74464367970.us-central1.run.app).

## Installation

1.  Install dependencies:
    ```bash
    npm install
    ```
2. Setup OpenAI account and get API key for LLM
3. Set up environment variables:
    Create a `.env` file in the root directory. You can copy `.env.example` if one exists, or add the necessary variables manually.

    ```
    # .env

    OPENAI_API_KEY=
    SKYFIRE_MCP_URL=
    REPORTING_MCP_URL=
    SKYFIRE_API_KEY=
    ```

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.