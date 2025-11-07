import base64
import json
import os

import firebase_admin
from firebase_admin import credentials, initialize_app

if not firebase_admin._apps:
    firebase_key_json = os.getenv("FIREBASE_KEY_JSON")

    if firebase_key_json:
        try:
            service_account_info = json.loads(firebase_key_json)
            cred = credentials.Certificate(service_account_info)
        except json.JSONDecodeError as exc:
            try:
                decoded = base64.b64decode(firebase_key_json).decode("utf-8")
                service_account_info = json.loads(decoded)
                cred = credentials.Certificate(service_account_info)
            except Exception as decode_exc:  # noqa: BLE001 - surface friendly error
                raise RuntimeError(
                    "FIREBASE_KEY_JSON must be valid JSON or base64-encoded JSON"
                ) from decode_exc
    else:
        cred = credentials.Certificate("firebase_key.json")

    initialize_app(cred)

