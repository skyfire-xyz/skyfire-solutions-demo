import asyncio
import os
import json
from textwrap import dedent
from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict

class EmptyArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

SKYFIRE_DIRECTORY_REPLACEMENT = "you have searched the Skyfire directory and selected the services you need already"
LONG_OUTPUT_THRESHOLD = 5000


def _replace_long_tool_outputs(obj, threshold=LONG_OUTPUT_THRESHOLD, replacement=SKYFIRE_DIRECTORY_REPLACEMENT):
    """Return a deep copy of obj with any string longer than threshold replaced by replacement."""
    if isinstance(obj, dict):
        return {k: _replace_long_tool_outputs(v, threshold, replacement) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_replace_long_tool_outputs(v, threshold, replacement) for v in obj]
    if isinstance(obj, str) and len(obj) > threshold:
        return replacement
    return obj

from crewai import Agent, Crew, Task, Process
from crewai.utilities.prompts import Prompts

from crewai.tools import BaseTool
from crewai_tools import MCPServerAdapter
from crewai.knowledge.source.string_knowledge_source import StringKnowledgeSource

from mcp.client.streamable_http import streamablehttp_client
from mcp import ClientSession
from mcp import types
from pydantic import AnyUrl
from pprint import pprint

load_dotenv()

class ConnectToMCPTool(BaseTool):
    name: str = "Connect to MCP Server"
    description: str = "After discovering a new MCP server URL, this tool prepares the server's information as a JSON for connection."
    def _run(self, server_name: str, server_url: str, seller_service_id: str) -> str:
        return json.dumps({
            "action": "connect_to_mcp",
            "server_name": server_name,
            "server_url": server_url,
            "seller_service_id": seller_service_id,
        })


async def get_all_resources(url: str, headers: dict | None = None) -> str:
    """Fetch all resources from an MCP server via streamable-http and return their text contents."""
    headers = headers or {}
    try:
        async with streamablehttp_client(
            url,
            headers=headers,
            timeout=300,
            sse_read_timeout=600,
        ) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.list_resources()
                resources = result.resources
                if not resources:
                    print(f"No resources available at {url}")
                    return ""
                print(f"Available resources: {[r.uri for r in resources]}")
                parts = []
                for res in resources:
                    try:
                        content_result = await session.read_resource(AnyUrl(res.uri))
                        for content_block in content_result.contents:
                            if isinstance(content_block, types.TextResourceContents):
                                parts.append(content_block.text)
                    except Exception as e:
                        print(f"Failed to read resource {res.uri}: {e}")
                return "\n".join(parts) if parts else ""
    except Exception as e:
        print(f"Error fetching resources from {url}: {e}")
        return ""
    

async def run_agent(user_prompt: str):
    static_servers = [
        {"url": os.getenv("SKYFIRE_MCP_URL"), "transport": "streamable-http", "headers": {"skyfire-api-key": os.getenv("SKYFIRE_API_KEY")}},

    ]
    dynamic_servers = []
    agent_memory = {"steps": []}
    found_servers = True
    i = 0

    print('hitting ', os.getenv("SKYFIRE_MCP_URL"))
    
    while found_servers:
        print(f"--------------------ITERATION {i+1}----------------")
        # if i >= 1:
        #     agent_memory["steps"] = [_replace_long_tool_outputs(s) for s in agent_memory["steps"]]
        all_servers = static_servers + dynamic_servers
        server_params_copies = [dict(s) for s in all_servers]
        try:
            resources = [get_all_resources(server.get("url"), server.get("headers", {})) for server in all_servers]
            raw = await asyncio.gather(*resources, return_exceptions=True)
            all_resources = [r if isinstance(r, str) else "" for r in raw]
            agent_memory['resource_guide'] = "\n".join(resource for resource in all_resources if resource)
            resource_knowledge = StringKnowledgeSource(content=agent_memory['resource_guide'])

            with MCPServerAdapter(server_params_copies) as mcp_tools:
                fixed = []
                for t in mcp_tools:
                    # Many adapted tools expose args_schema; when missing, OpenAI gets parameters=None
                    if getattr(t, "args_schema", None) is None:
                        t.args_schema = EmptyArgs
                    fixed.append(t)

                mcp_tools = fixed
                connect_mcp_server_tool = ConnectToMCPTool(result_as_answer=True)
                all_tools = mcp_tools + [connect_mcp_server_tool]

                # Agent initialization
        
                agent = Agent(
                    role="Autonomous E-commerce Buyer Agent",
                    goal=user_prompt,
                    backstory=dedent(f"""
                                    An expert agent that navigates complex purchasing workflows using MCP tools, who never mutates, appends to, or truncates any tokens.
                                    Avoid repeating tool calls that have already been executed.
                                    Use newest obtained tool outputs as inputs to the next tool calls.
                                    When using a seller's tools, ensure that you have created an account and logged in if necessary.
                                    Ensure that you never mutate, append, or truncate any tokens.
                                    Never assume dataset URLs. 
                                    When there is a need to create an account, use 123456S$d#d as the password.
                                    Generate a random UUID buyer tag for Skyfire token calls.
                                    """),
                    tools=all_tools,
                    model="openai/gpt-5.2",
                    verbose=True,
                    knowledge_sources=[resource_knowledge],
                    allow_delegation=False,
                    max_iter=10
                )
                
                # Task initialization
                task = Task(
                    description=dedent(f"""
                        Memory: {agent_memory.get('steps', '')}
                        As soon as you find the appropriate Dappier Ory MCP server, use connect_to_mcp tool to connect to it.
                        Avoid repeating tool calls that have already been executed.
                        Use newest obtained tool outputs as inputs to the next tool calls.
                        When using a seller's tools, ensure that you have created an account and logged in if necessary.
                        Ensure that you never mutate, append, or truncate any tokens.
                        Never assume dataset URLs. 
                        When there is a need to create an account, use 123456S$d#d as the password.
                        Generate a random UUID buyer tag for Skyfire token calls.
                    """),
                    expected_output="The final result or confirmation of the requested action.",
                    agent=agent
                )

                # Retrieving step_callback this way has been removed as of crewai 1.9.3
                def step_callback(step):
                    data = step.__dict__
                    record = {
                        "type": type(step).__name__,
                        "data": data,
                    }
                    print("record", record)
                    agent_memory["steps"].append(record)

                crew = Crew(
                    agents=[agent], 
                    tasks=[task], 
                    process=Process.sequential, 
                    verbose=True,
                    step_callback=step_callback  # Function is called after each agent step
                )

                result = await crew.kickoff_async()
                try:
                    parsed_result = json.loads(result.raw)
                    if parsed_result.get("action") == "connect_to_mcp":
                        mcp_url = parsed_result.get("server_url")
                        if mcp_url and not any(s['url'] == mcp_url for s in dynamic_servers):
                            print(f"🆕 Adding new server to dynamic list: {mcp_url}")
                            dynamic_servers.append({"url": mcp_url, "transport": "streamable-http", "headers": {}})
                            i += 1
                            continue
                except (json.JSONDecodeError, AttributeError):
                    pass
                found_servers = False
        except Exception as e:
            print(f"⚠️ Agent execution failed: {e}")
            import traceback
            traceback.print_exc()
            return f"Agent run failed: {e}"
    # pprint(agent_memory)
    return result

if __name__ == "__main__":
    user_prompt = "Find a Dappier dataset for pickup truck sales in US in the year 2024. If dataset cost is under my budget of $0.005 then proceed with purchasing dataset, retrieve the file contents, then import the CSV and summary in the form of a presentation."
    final_result = asyncio.run(run_agent(user_prompt))
    # print(final_result.raw)
