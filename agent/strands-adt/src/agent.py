# ---------------------------------------------------------------------------
#  AUTO-GENERATED agent.py TEMPLATE
# ---------------------------------------------------------------------------
# This file will be rendered into <project>/src/agent.py by `agent init`.
# It demonstrates the **provider-agnostic** loading pattern:
#   • The ONLY configuration file is `.agent.yaml`.
#   • That YAML contains a `provider.class` (import path) and free-form
#     `provider.kwargs` forwarded verbatim to the model constructor.
#   • Keys ending with `_env` are replaced by the value of the referenced
#     environment variable at runtime so that secrets never live in source
#     control.  Example:
#       api_key_env: OPENAI_API_KEY   # → api_key=<value of $OPENAI_API_KEY>
#
#   How to switch model providers
#   --------------------------------
#   1. Open `.agent.yaml`.
#   2. Change `provider.class` to the fully-qualified path of the new model
#      (e.g. `strands.models.anthropic.AnthropicModel`).
#   3. Update / add fields inside `provider.kwargs` as required by that class.
#   4. Restart `agent dev` or rebuild the container. No code edits necessary.
#
#   How to add tools
#   ----------------
#   1. For built-in tools: Uncomment the imports and add to tools list below.
#   2. For custom tools: Add .py files to src/tools/ - they're auto-discovered.
# ---------------------------------------------------------------------------

import os, importlib, yaml
from pathlib import Path

from strands import Agent


# Built-in tools from strands_tools (uncomment the ones you want to use)
# from strands_tools import calculator      # Mathematical calculations
# from strands_tools import file_read       # Read file contents
# from strands_tools import shell           # Execute shell commands
# from strands_tools import web_search      # Search the web
# from strands_tools import image_generator # Generate images
# from strands_tools import email_sender    # Send emails
# from strands_tools import http_request    # Perform HTTP requests
# from strands_tools import python_repl     # Execute Python code (see §8.1)

# MCP (Model Context Protocol) integration (always import – the helper fails gracefully if MCP not installed)
from src.mcp_tools import get_mcp_tools_sync

# Custom tools (auto-discovered from src/tools/)
from src.tools import get_tools

# Enable OpenTelemetry tracing for development (console only)
os.environ["STRANDS_OTEL_ENABLE_CONSOLE_EXPORT"] = "true"

# ---------------------------------------------------------------------------
# Python REPL inside FastAPI / Uvicorn
# ---------------------------------------------------------------------------
# By default the REPL starts a PTY and its own asyncio loop.  In server
# environments that already have a running loop this crashes.  Uncomment the
# next line to disable interactive mode by default (still overridable per
# call with `interactive=True`).  See User Guide §8.1 for details.
# os.environ["PYTHON_REPL_INTERACTIVE"] = "false"




def _resolve_env(obj):
    """Replace *_env keys with env-var values (recursively)."""
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k.endswith("_env"):
                env_val = os.getenv(v)
                if env_val is None:
                    raise RuntimeError(f"Environment variable '{v}' is not set")
                out[k[:-4]] = env_val  # strip _env suffix
            else:
                out[k] = _resolve_env(v)
        return out
    if isinstance(obj, list):
        return [_resolve_env(i) for i in obj]
    return obj


def load_config():
    """Load `.agent.yaml` from project root and return as dict.

    The YAML is the *only* place you configure model/provider parameters.
    If the file is missing an empty dict is returned so the template still
    works in unit-tests."""
    cfg_path = Path(__file__).parent.parent / ".agent.yaml"
    return yaml.safe_load(cfg_path.read_text()) if cfg_path.exists() else {}


def load_model(cfg: dict):
    """Dynamically import the model class and instantiate it.

    Steps:
    1. Read `provider.class` → dotted import path.
    2. Import the module and fetch the class.
    3. Resolve any *_env placeholders in `provider.kwargs`.
    4. Instantiate the model with those kwargs.
    """
    provider = cfg.get("provider", {})
    fqcn = provider.get("class")
    if not fqcn:
        raise ValueError("Missing 'provider.class' in .agent.yaml")

    module_path, class_name = fqcn.rsplit('.', 1)
    ModelCls = getattr(importlib.import_module(module_path), class_name)

    kwargs = _resolve_env(provider.get("kwargs", {}))
    return ModelCls(**kwargs)


# Import Carbon Arc specific implementation
from src.carbon_arc_agent import CarbonArcStrandsAgent


def create_agent():
    """Factory that wires model + tools + system prompt into one Agent."""
    cfg = load_config()
    model = load_model(cfg)

    # Clear the log file at startup for fresh slate
    with open("agent.log", 'w') as f:
        f.write("")

    # Initialize the Carbon Arc agent with the model
    api_key = os.getenv("SKYFIRE_API_KEY", "")

    # Create the Carbon Arc agent instance
    agent = CarbonArcStrandsAgent(
        api_key=api_key,
    )

    return agent


# Initialize the singleton agent
agent = create_agent()

#user prompt
# Find a dataset for pickup truck sales in US in the year 2024 and export it