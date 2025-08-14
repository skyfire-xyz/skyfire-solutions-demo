from strands import tool
from typing import Dict, Any
import jwt

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
