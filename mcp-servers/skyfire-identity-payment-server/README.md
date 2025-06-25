# Skyfire Identity & Payment MCP Server

This MCP Server has one resource - 
1. A guide explaining all the available tools and pre-requisite knowledge for LLM to understand the flow of calling tools.

This MCP Server also has three tools - 
1. find-seller: Needs an input prompt to identify relevant sellers for. This tool returns seller details (seller name, sellerServiceId and MCP server URL). MCP server URL is not same as dataset URL
2. create-kya-token: This tool generates and returns the KYA token (JWT). KYA stands for Know Your Agent. KYA token is in JWT format which has user details in the JWT payload. This token could be used to share agent information for creating new account or login to existing account or for any other usecase which needs agent information.
3. create-payment-token: This tool takes amount and sellerServiceId to create a PAY token (JWT) for a transaction. It returns generated PAY token (JWT). PAY token stands for payment token. Whenever PAY token is generated it actually deducts money from the linked wallet. So, essentially PAY token should only be generated if intention is to execute a payment transaction.

## Getting Started

- Use the Skyfire Setup Guide to create a seller account and a seller service
- Run the CarbonArc MCP server locally. For demo, this is mocked inside find-seller tool, in real world, find-seller tool will call a registry to get the actual MCP server URL.  

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd skyfire-identity-payment-mcp-server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    Create a `.env` file in the root directory. You can copy `.env.example` if one exists, or add the necessary variables manually.

    ```
    # .env
    CARBONARC_SELLER_SERVICE_ID=your_seller_service_id
    SKYFIRE_API_BASE_URL=https://api-qa.skyfire.xyz
    CARBONARC_MCP_SERVER_URL=<your_local_carbonarc_mcp_server_url>
    ```

## Run the development server:

```bash
npm run dev
```

The MCP server will run on [http://localhost:8788](http://localhost:8788).