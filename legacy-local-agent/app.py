from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from commands import parse_command

app = FastAPI()

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CommandRequest(BaseModel):
    text: str

class CommandResponse(BaseModel):
    action: str
    target: str | None
    message: str

@app.post("/api/command", response_model=CommandResponse)
async def process_command(request: CommandRequest):
    print(f"Received command: {request.text}")
    action, target, message = parse_command(request.text)
    return CommandResponse(action=action, target=target, message=message)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
