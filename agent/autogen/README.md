# Data Analyst Autogen Agent

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