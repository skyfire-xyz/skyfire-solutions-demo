# tools.py
import os
import httpx
from crewai.tools import BaseTool


class SkyfireCreateKYATokenTool(BaseTool):
    name: str = "skyfire_create_kya_token"
    description: str = "Calls Skyfire MCP to create a KYA token and returns it as a string."

    def _run(self) -> str:
        api_key = os.getenv("SKYFIRE_API_KEY")
        if not api_key:
            raise ValueError("Missing SKYFIRE_API_KEY in environment.")

        # Skyfire MCP endpoint (from your example)
        url = "https://mcp.skyfire.xyz/mcp"

        # NOTE: The exact MCP JSON-RPC shape depends on the server.
        # This is a common JSON-RPC-ish pattern. If your server expects a different payload,
        # update `payload` accordingly.
        payload = {
            "jsonrpc": "2.0",
            "id": "1",
            "method": "tools.call",
            "params": {
                "name": "create-kya-token",
                "arguments": {}
            },
        }

        headers = {
            "content-type": "application/json",
            "skyfire-api-key": api_key,
        }

        with httpx.Client(timeout=30) as client:
            r = client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()

        # Try a few common response shapes
        # Adjust this extraction once you see the real response.
        token = (
            data.get("result", {}).get("token")
            or data.get("result", {}).get("content")
            or data.get("result")
            or data.get("token")
        )

        if not token or not isinstance(token, str):
            raise RuntimeError(f"Unexpected Skyfire response (couldn't find token): {data}")

        return token


class DappierRealtimeSearchTool(BaseTool):
    name: str = "dappier_realtime_search"
    description: str = (
        "Calls Dappier MCP real-time-search. Inputs: token (Skyfire KYA token), query (string). "
        "Returns the search result as text."
    )

    def _run(self, token: str, query: str) -> str:
        dappier_key = os.getenv("DAPPIER_API_KEY")
        if not dappier_key:
            raise ValueError("Missing DAPPIER_API_KEY in environment.")

        # Dappier MCP endpoint (from your example)
        url = f"https://mcp.dappier.com/mcp?apiKey={dappier_key}"

        # NOTE: Like above, this payload may need to match Dappier's MCP schema.
        payload = {
            "jsonrpc": "2.0",
            "id": "1",
            "method": "tools.call",
            "params": {
                "name": "real-time-search",
                "arguments": {
                    "query": query,
                    # pass the Skyfire token as auth credential per tool schema (example field name)
                    "auth": {"token": token},
                },
            },
        }

        headers = {"content-type": "application/json"}

        with httpx.Client(timeout=30) as client:
            r = client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()

        # Try common response shapes
        out = (
            data.get("result", {}).get("text")
            or data.get("result", {}).get("content")
            or data.get("result")
        )

        if out is None:
            raise RuntimeError(f"Unexpected Dappier response: {data}")

        return out if isinstance(out, str) else str(out)