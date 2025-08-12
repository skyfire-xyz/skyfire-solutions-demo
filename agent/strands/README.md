# Data Analyst Strands Agent

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

- Data Analyst Strands Agent

## Installation

### Prerequisites
- Python 3.8+
- AWS credentials configured for Bedrock access
- Network access to MCP servers

### Setup

1. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

2. **Configure AWS Credentials**:

Go to configure credential in this Strands documentation
https://strandsagents.com/latest/documentation/docs/user-guide/quickstart/

Get access to bedrock in AWS

## Installation

### Prerequisites
- Python 3.8+
- AWS credentials configured for Bedrock access
- Network access to MCP servers

### Setup

1. **Install Dependencies**:
```bash
pip install strands-agents strands-tools PyJWT requests
```

2. **Configure AWS Credentials**:

Go to configure credential in this doc
https://strandsagents.com/latest/documentation/docs/user-guide/quickstart/

Get access to bedrock in AWS

Get the following env variable and set them up 

Configure your AWS secrets and keys
```bash
# Option 1: AWS CLI
aws configure

# Option 2: Environment variables in terminal where running agent
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_REGION="region
```

Then **Put in the env variable file**:
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_REGION="region
SKYFIRE_API_KEY=
SKYFIRE_MCP_SERVER_URL=
REPORTING_MCP_SERVER_URL=


## Usage

### Quick Start

Run the simplified demo:
```bash
python agent.py
```