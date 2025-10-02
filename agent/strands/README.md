# Data Analyst Strands Agent


## Demo

[Video demo](https://youtu.be/83eiH0iRWRA)

## Installation

1. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

2. **Configure AWS Credentials**:

   - Follow the [Strands documentation Quickstart](https://strandsagents.com/latest/documentation/docs/user-guide/quickstart/) to configure your credentials.
   - Get [access to Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html) in AWS 
   - Obtain your AWS secrets for step 4

3. **Skyfire Platform Setup**:
   Follow the [Skyfire Platform Setup Guide](https://docs.skyfire.xyz/docs/introduction) to create Skyfire API key, complete Buyer and Seller Onboarding.

4. **Set Environment Variables**:

   Configure your AWS secrets and keys:
   ```bash
   # Option 1: AWS CLI
   aws configure

   # Option 2: Environment variables in terminal where running agent
   export AWS_ACCESS_KEY_ID="your_access_key"
   export AWS_SECRET_ACCESS_KEY="your_secret_key"
   export AWS_REGION="your_region"
   ```

   Then add to your environment file:
   ```bash
   AWS_ACCESS_KEY_ID="your_access_key"
   AWS_SECRET_ACCESS_KEY="your_secret_key"
   AWS_REGION="your_region"
   SKYFIRE_API_KEY="your_skyfire_api_key"
   SKYFIRE_MCP_SERVER_URL="your_skyfire_mcp_server_url"
   REPORTING_MCP_SERVER_URL="your_reporting_mcp_server_url"
   ```

## Usage

### Quick Start

Run the agent:
```bash
python agent.py
```
