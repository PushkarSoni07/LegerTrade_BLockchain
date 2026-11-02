import uvicorn
import os
import sys

# Ensure the ml-service root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    print(f"Starting LedgerTrade AI Surveillance Service on http://{host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=False, log_level="info")
