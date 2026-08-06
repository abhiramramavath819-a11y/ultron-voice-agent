"""
ULTRON local companion.

The deployed web agent runs in a browser sandbox and cannot touch your computer.
This is the piece that can. Run it on your own machine and the web app will find it.

    pip install fastapi uvicorn
    python agent.py

Security, deliberately, and please read this:

  * It binds to 127.0.0.1 only. Nothing on your network can reach it.
  * It requires a token, printed on startup, that you paste into the web app once.
  * It runs an ALLOWLIST, not a shell. There is no way to make it execute an
    arbitrary command, because the previous version of this file did exactly that
    and an endpoint that runs anything is a remote code execution hole waiting
    for the first malicious page you visit.

If you want a new capability, add it to COMMANDS below by hand. That deliberate
step is the security model.
"""

import os
import platform
import secrets
import subprocess
import sys

try:
    from fastapi import FastAPI, Header, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn
except ImportError:
    sys.exit("Missing dependencies. Run:  pip install fastapi uvicorn")

TOKEN = os.environ.get("ULTRON_LOCAL_TOKEN") or secrets.token_urlsafe(12)
SYSTEM = platform.system()  # Windows, Darwin, Linux

# Only these origins may talk to this process. A wildcard here would let any
# website you visit drive your computer.
ALLOWED_ORIGINS = [
    "https://ultron-voice-agent-abhi-47c3.vercel.app",
    "http://localhost:3000",
]


def _cmd(windows, mac, linux):
    return {"Windows": windows, "Darwin": mac, "Linux": linux}.get(SYSTEM)


# The allowlist. Each entry is a fixed argument vector, never a shell string,
# so nothing the model emits can be interpolated into a command.
COMMANDS = {
    "notepad":        _cmd(["notepad.exe"], ["open", "-a", "TextEdit"], ["gedit"]),
    "calculator":     _cmd(["calc.exe"], ["open", "-a", "Calculator"], ["gnome-calculator"]),
    "browser":        _cmd(["cmd", "/c", "start", "", "https://www.google.com"],
                           ["open", "https://www.google.com"],
                           ["xdg-open", "https://www.google.com"]),
    "explorer":       _cmd(["explorer.exe"], ["open", "."], ["xdg-open", "."]),
    "terminal":       _cmd(["cmd.exe"], ["open", "-a", "Terminal"], ["x-terminal-emulator"]),
    "settings":       _cmd(["cmd", "/c", "start", "ms-settings:"],
                           ["open", "-a", "System Settings"], ["gnome-control-center"]),
    "lock":           _cmd(["rundll32.exe", "user32.dll,LockWorkStation"],
                           ["pmset", "displaysleepnow"], ["loginctl", "lock-session"]),
    "screenshot":     _cmd(["cmd", "/c", "start", "ms-screenclip:"],
                           ["screencapture", "-i", os.path.expanduser("~/Desktop/ultron.png")],
                           ["gnome-screenshot", "-i"]),
    "volume-up":      _cmd(None, ["osascript", "-e", "set volume output volume (output volume of (get volume settings) + 10)"],
                           ["amixer", "-q", "sset", "Master", "10%+"]),
    "volume-down":    _cmd(None, ["osascript", "-e", "set volume output volume (output volume of (get volume settings) - 10)"],
                           ["amixer", "-q", "sset", "Master", "10%-"]),
    "mute":           _cmd(None, ["osascript", "-e", "set volume output muted true"],
                           ["amixer", "-q", "sset", "Master", "toggle"]),
    "play-pause":     _cmd(None, ["osascript", "-e", 'tell application "Music" to playpause'],
                           ["playerctl", "play-pause"]),
    "next-track":     _cmd(None, ["osascript", "-e", 'tell application "Music" to next track'],
                           ["playerctl", "next"]),
    "previous-track": _cmd(None, ["osascript", "-e", 'tell application "Music" to previous track'],
                           ["playerctl", "previous"]),
}

app = FastAPI(title="ULTRON local companion")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["content-type", "x-ultron-token"],
)


class Command(BaseModel):
    command: str


@app.get("/health")
def health():
    """Lets the web app show 'PC linked' without needing the token."""
    return {
        "ok": True,
        "system": SYSTEM,
        "available": sorted(k for k, v in COMMANDS.items() if v),
    }


@app.post("/run")
def run(body: Command, x_ultron_token: str = Header(default="")):
    if not secrets.compare_digest(x_ultron_token, TOKEN):
        raise HTTPException(status_code=401, detail="Bad or missing token.")

    name = body.command.strip().lower()
    if name not in COMMANDS:
        raise HTTPException(status_code=400, detail=f"'{name}' is not in the allowlist.")

    argv = COMMANDS[name]
    if not argv:
        raise HTTPException(status_code=501, detail=f"'{name}' is not supported on {SYSTEM}.")

    try:
        # shell=False always. The argv is a constant from the table above.
        subprocess.Popen(argv, shell=False)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f"'{name}' is not installed on this machine.")
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

    return {"ran": name}


if __name__ == "__main__":
    print("\n  ULTRON local companion")
    print(f"  Platform: {SYSTEM}")
    print(f"  Listening on http://127.0.0.1:8765  (this machine only)")
    print(f"\n  Paste this token into the web app, under Computer link:\n\n      {TOKEN}\n")
    print("  Ctrl-C to stop. While this is closed, the agent cannot touch your computer.\n")
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")
