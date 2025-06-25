# Skyfire E2E App

This project is a Next.js application designed to demonstrate end-to-end commerce flows using Skyfire technologies. It features an AI agent interface that interacts with services via the Model Context Protocol (MCP) to simulate tasks like data discovery, verification, and purchasing, leveraging the Vercel AI SDK.

## Prerequisites

- Node.js (LTS version recommended - specific version not defined in project files)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd skyfire-e2e-app
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    Create a `.env` file in the root directory. You can copy `.env.example` if one exists, or add the necessary variables manually.

    ```
    # .env

    # Required by AI SDK for the agent model
    OPENAI_API_KEY=your_openai_api_key

    # Required by the agent actions (replace with actual URLs)
    SKYFIRE_MCP_URL=your_skyfire_mcp_server_url
    ```

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.