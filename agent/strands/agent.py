import os
import json
import jwt
import logging
import asyncio
from typing import Dict, List, Optional, Any
from strands import Agent, tool
from mcp.client.streamable_http import streamablehttp_client
from mcp.client.sse import sse_client
from strands_tools import mcp_client
from strands.tools.mcp.mcp_client import MCPClient, MCPCallToolResult
from strands.experimental.hooks import BeforeToolInvocationEvent, AfterToolInvocationEvent
from strands.hooks import HookProvider, HookRegistry, MessageAddedEvent
import requests
from dotenv import load_dotenv
from contextlib import ExitStack
import time
import traceback
from mcp import ClientSession, types
from mcp.client.sse import sse_client
from pydantic import AnyUrl

load_dotenv()

# Environment variables for MCP servers
SKYFIRE_MCP_URL = os.getenv("SKYFIRE_MCP_SERVER_URL", "")
REPORTING_MCP_URL = os.getenv("REPORTING_MCP_SERVER_URL", "")
SKYFIRE_API_KEY = os.getenv("SKYFIRE_API_KEY", "")

system_prompt = """You are a e-commerce buyer agent assisting user to make a purchase.
Generate a random UUIDv4 buyer tag for skyfire token calls.
After you dynamically connect to a new MCP server, call mcp_client: 'action': 'list_tools', 'connection_id': 'dappier_seller' to see the arguments you need to use the tools from the MCP server
{additional_context}
Remember to call the decode_jwt_token tool immediately after you receive jwts. Do no truncate or mutate tokens.
Whenever there is a need to create an account, use 123456S$d#d as the password
"""


class ToolCallLogger(HookProvider):
    def __init__(self):
        self.log_file = "agent.log"

    def register_hooks(self, registry: HookRegistry) -> None:
        registry.add_callback(BeforeToolInvocationEvent, self.log_input)
        registry.add_callback(AfterToolInvocationEvent, self.log_output)
        registry.add_callback(MessageAddedEvent, self.log_message)

    def log_input(self, event: BeforeToolInvocationEvent) -> None:
        tool_call = f"[TOOL CALL] {event.tool_use['name']}: {event.tool_use['input']}"
        print()
        print(tool_call)
        with open(self.log_file, 'a') as f:
            f.write(tool_call + "\n")

    def log_output(self, event: AfterToolInvocationEvent) -> None:
        tool_result = f"[TOOL RESULT] {event.tool_use['name']}: {event.result}"
        print(tool_result)
        print()
        with open(self.log_file, 'a') as f:
            f.write(tool_result + "\n")

    def log_message(self, event: MessageAddedEvent) -> None:
        """Log assistant messages as they're added to the conversation"""
        if event.message.get('role') == "assistant":
            # Extract text content from the message
            content = event.message.get('content')
            if content:
                if isinstance(content, list):
                    for content_item in content:
                        if isinstance(content_item, dict) and content_item.get('text'):
                            assistant_text = f"[ASSISTANT] {content_item['text']}"
                            # print(assistant_text)
                            with open(self.log_file, 'a') as f:
                                f.write(assistant_text + "\n")
                elif isinstance(content, str):
                    assistant_text = f"[ASSISTANT] {content}"
                    # print(assistant_text)
                    with open(self.log_file, 'a') as f:
                        f.write(assistant_text + "\n")

    def log_agent_text(self, text: str):
        """Log agent's text response"""
        print(f"[AGENT] {text}")
        with open(self.log_file, 'a') as f:
            f.write(f"[AGENT] {text}\n")


class AgentContext:
    """Agent Context to maintain state across interactions"""

    def __init__(self):
        self.available_mcp_servers = [
            {
                "url": SKYFIRE_MCP_URL,
                "headers": {"skyfire-api-key": SKYFIRE_API_KEY}
            },
            {
                "url": REPORTING_MCP_URL,
            }
        ]
        self.dynamically_mounted_servers = []
        # self.conversation_history = []


@tool
async def decode_jwt_token(token: str) -> Dict[str, Any]:
    """
    Decode a JWT token to extract header and payload.

    Args:
        token: JWT token to decode

    Returns:
        Decoded JWT with header and payload
    """
    try:
        header = jwt.get_unverified_header(token)
        payload = jwt.decode(token, options={"verify_signature": False})
        return {
            "header": header,
            "payload": payload,
            "token": token
        }
    except Exception as e:
        return {"error": f"Failed to decode JWT: {str(e)}"}


class DappierStrandsAgent:
    """Simplified Dappier Agent implementation using ExitStack approach"""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.agent_context = AgentContext()
        self.agent_context.available_mcp_servers[0]["headers"]["skyfire-api-key"] = api_key
        self.agent = None
        self.formatted_steps = []

    async def _get_all_resources(self, url: str, headers: Dict[str, str] = None) -> str:
        """Get all resources from an MCP server"""
        try:
            if '/sse' in url.lower():
                async with sse_client(url, headers or {}) as (read, write):
                    async with ClientSession(read, write) as session:
                        # Initialize the connection
                        await session.initialize()
                        try:
                            # List available resources
                            resources = await session.list_resources()
                            print(f"Available resources: {[r.uri for r in resources.resources]}")

                            # Collect all resources
                            all_resource_texts = []
                            for resource in resources.resources:
                                try:
                                    resource_content = await session.read_resource(AnyUrl(resource.uri))
                                    content_block = resource_content.contents[0]
                                    if isinstance(content_block, types.TextResourceContents):
                                        all_resource_texts.append(f"Resource {resource.uri}: {content_block.text}")
                                except Exception as e:
                                    print(f"Failed to read resource {resource.uri}: {e}")

                            return "\n\n".join(all_resource_texts) if all_resource_texts else ""
                        except Exception as e:
                            print(f"There are no resources available in {url}: {e}")
                            return ""
            else:
                # For HTTP transport, we'll skip resource fetching for now
                return ""
        except Exception as e:
            print(f"Error fetching resources from {url}: {e}")
            return ""

    async def _get_all_resources_text(self) -> str:
        """Get all resources from all connected servers as a single text"""
        all_resources = []

        # Get all server configurations
        all_servers = [
            *self.agent_context.available_mcp_servers,
            *self.agent_context.dynamically_mounted_servers
        ]

        for server in all_servers:
            if isinstance(server, dict):
                url = server.get('url')
                headers = server.get('headers', {})
            else:
                url = server
                headers = {}

            if url:
                try:
                    resources_text = await self._get_all_resources(url, headers)
                    if resources_text:
                        all_resources.append(f"=== Resources from {url} ===\n{resources_text}")
                except Exception as e:
                    print(f"Error getting resources from {url}: {e}")

        return "\n\n".join(all_resources) if all_resources else ""

    def _get_server_configs(self):
        """Get all server configurations including dynamic ones"""
        configs = []

        # Add available MCP servers
        for server in self.agent_context.available_mcp_servers:
            url = server.get('url')
            headers = server.get('headers', {})

            if '/sse' in url.lower():
                configs.append(lambda url=url, headers=headers: sse_client(url, headers=headers))
            else:
                configs.append(lambda url=url, headers=headers: streamablehttp_client(url, headers=headers))

        # Add dynamic servers
        for server_config in self.agent_context.dynamically_mounted_servers:
            url = server_config.get('url')
            headers = server_config.get('headers', {})

            if '/sse' in url.lower():
                configs.append(lambda url=url, headers=headers: sse_client(url, headers=headers))
            else:
                configs.append(lambda url=url, headers=headers: streamablehttp_client(url, headers=headers))

        return configs


    async def run(self, input_text: str) -> str:
        """Run the agent with dynamic mcp connection capabilitiy"""
        all_tools = []
        # Add static tools
        all_tools.extend([
            decode_jwt_token,
            mcp_client
        ])
        # Get server configurations
        server_configs = self._get_server_configs()

        # Create MCPClients
        clients = [MCPClient(factory) for factory in server_configs]

        # Use all clients together with ExitStack
        with ExitStack() as stack:
            for i, client in enumerate(clients):
                try:
                    stack.enter_context(client)
                    tools = client.list_tools_sync()
                    all_tools.extend(tools)
                    print(f"✅ Connected to server {i+1}: Found {len(tools)} tools")
                except Exception as e:
                    print(f"❌ Failed to connect to server {i+1}: {e}")
                    continue

            print(f"📦 Total tools available: {len(all_tools)}")

            # Get all resources from connected servers
            resources_text = await self._get_all_resources_text()

            # Create agent with all current tools
            formatted_system_prompt = system_prompt.format(
                additional_context=resources_text
            )
            print("FORMATED SYSTEM PROMPT", formatted_system_prompt)
            tool_logger = ToolCallLogger()
            self.agent = Agent(
                tools=all_tools,
                system_prompt=formatted_system_prompt,
                hooks=[tool_logger]
            )
            response = self.agent(input_text)

    
        return response



async def main():
    """Main function to demonstrate the simplified Dappier agent"""

    # Clear the log file at startup for fresh slate
    with open("agent.log", 'w') as f:
        f.write("")

    # Initialize the agent
    api_key = os.getenv("SKYFIRE_API_KEY", "")
    agent = DappierStrandsAgent(api_key)

    # Example usage
    print("🛒 Dappier Dataset Buyer Agent")

    user_input = """
    Find a dataset for pickup truck sales in US in the year 2024. If dataset cost is under my budget of $0.005 then proceed with purchasing dataset and finally retrieve the contents and summarize the dataset before making a presentation.
    """

    try:
        # Use the simplified restart functionality
        result = await agent.run(user_input)

        print(f"\nAgent Response: {result}")

    except Exception as e:
        print(f"Error running agent: {e}")


if __name__ == "__main__":
    asyncio.run(main())
