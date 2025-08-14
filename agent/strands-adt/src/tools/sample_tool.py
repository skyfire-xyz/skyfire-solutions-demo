from strands import tool

@tool
def sample_tool(message: str) -> str:
    """A sample tool that echoes back the input with a greeting
    
    Args:
        message: The message to process
        
    Returns:
        str: The processed message
    """
    return f"Hello! You said: {message}" 