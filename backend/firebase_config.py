from firebase_admin import credentials, initialize_app
import firebase_admin

if not firebase_admin._apps:
    cred = credentials.Certificate("firebase_key.json")
    initialize_app(cred)

