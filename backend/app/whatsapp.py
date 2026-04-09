import os
import requests
import logging

logger = logging.getLogger(__name__)

WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN")
WHATSAPP_PHONE_ID = os.environ.get("WHATSAPP_PHONE_ID", "1019942661205890")
API_URL = f"https://graph.facebook.com/v19.0/{WHATSAPP_PHONE_ID}/messages"

headers = {
    "Authorization": f"Bearer {WHATSAPP_TOKEN}",
    "Content-Type": "application/json",
}

def send_whatsapp_text(to: str, message: str):
    """Envia un mensaje de texto plano a traves de Meta Cloud API"""
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"preview_url": False, "body": message}
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()
        logger.info(f"WhatsApp Text enviado a {to}: {response.json()}")
    except requests.exceptions.HTTPError as e:
        logger.error(f"Error enviando mensaje WhatsApp a {to}: {e.response.text}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")

def send_whatsapp_interactive(to: str, message: str, buttons: list):
    """
    Envia un mensaje con botones.
    buttons es una lista de diccionarios, max 3 botones: [{"id": "btn1", "title": "Aceptar"}, ...]
    """
    interactive_buttons = []
    for btn in buttons:
        interactive_buttons.append({
            "type": "reply",
            "reply": {
                "id": btn["id"],
                "title": btn["title"]
            }
        })

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {
                "text": message
            },
            "action": {
                "buttons": interactive_buttons
            }
        }
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()
        logger.info(f"WhatsApp Botones enviado a {to}: {response.json()}")
    except requests.exceptions.HTTPError as e:
        logger.error(f"Error enviando botones WhatsApp a {to}: {e.response.text}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
