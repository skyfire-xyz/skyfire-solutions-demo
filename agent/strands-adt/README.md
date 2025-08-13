# Strands-adt

Built using the Agent Development Toolkit. For more details on AWS ADT look (here)[https://github.com/awslabs/agent-dev-toolkit]

# Data Analyst Strands Agent

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

**Option A: Using environment file**
```bash
adt dev --env-file .env
```

**Option B: Using AWS profile**
```bash
adt dev --aws-profile your-profile-name
```

**Option C: Using environment variables set in the terminal (no options needed)**
```bash
# If you have AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY set
adt dev
```

**Option D: Custom port**
```bash
adt dev --port 8000 --env-file .env
```

Visit http://localhost:8000 (or your custom port) to interact with your agent.


## Configuration

Edit `.agent.yaml` to change providers or model settings.
See the commented examples in the file for different provider configurations.

## Adding Tools

Add new tools with:
```bash
adt add tool my_tool_name
```

This creates a new tool file in `src/tools/` with a template to get you started.

## Project Structure

- `src/agent.py` - Main agent configuration
- `src/tools/` - Tool implementations  
- `.agent.yaml` - Agent configuration
- `requirements.txt` - Python dependencies
- `.env.example` - Environment variables template
- `Dockerfile` - Example Docker configuration for local development



