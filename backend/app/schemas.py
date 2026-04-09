from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class WaWebhookPayload(BaseModel):
    # Payload model that n8n webhook will send to FastAPI
    phone_number: str
    message: str
    message_type: str = "text" # text, button, interactive etc.

class N8nSendMessage(BaseModel):
    phone_number: str
    message: str
