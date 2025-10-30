import os
import sys

# Change to the backend directory
os.chdir(os.path.dirname(__file__))

print("Starting server from:", os.getcwd())
print("Python path:", sys.path)

import uvicorn

if __name__ == "__main__":
    print("About to start uvicorn...")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8002,  # Changed to 8002 to avoid conflicts
        reload=False  # Disable reload
    )