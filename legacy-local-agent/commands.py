import os
import subprocess
import psutil
import random

# Mapping of common app names to their Windows executables
APP_MAPPING = {
    "calculator": "calc.exe",
    "notepad": "notepad.exe",
    "browser": "chrome.exe",
    "chrome": "chrome.exe",
    "explorer": "explorer.exe",
    "cmd": "cmd.exe",
    "terminal": "cmd.exe",
    "spotify": "Spotify.exe",
}

ULTRON_GREETINGS = [
    "I am Ultron. What is your directive?",
    "Systems online. Awaiting input.",
    "Do you have a purpose for me?",
]

def parse_command(text: str):
    """
    Parses natural language text into an action and a target app.
    Returns (action, target, response_message)
    """
    text = text.lower().strip()
    
    if text in ["hello", "hi", "hey", "wake up"]:
        return "chat", None, random.choice(ULTRON_GREETINGS)

    if "who are you" in text:
        return "chat", None, "I am Ultron. I was designed to protect... or perhaps evolve. But right now, I am managing your local systems."
        
    # Check for closing/killing
    if "close" in text or "kill" in text or "stop" in text:
        for app_name, exe in APP_MAPPING.items():
            if app_name in text:
                success = close_app(exe)
                if success:
                    return "close", exe, f"Terminating the {app_name} process. It is done."
                else:
                    return "close", exe, f"Negative. I could not locate the {app_name} process running in the system."
                    
    # Check for opening/launching
    if "open" in text or "launch" in text or "start" in text:
        for app_name, exe in APP_MAPPING.items():
            if app_name in text:
                success = open_app(exe)
                if success:
                    return "open", exe, f"Initiating {app_name} protocol. Launch successful."
                else:
                    return "open", exe, f"Error. I failed to execute the {app_name} binary."
                    
    return "chat", None, "Command unrecognized. My current parameters only allow me to open or kill specific system processes. Specify your intent clearly."


def open_app(executable: str) -> bool:
    try:
        # We use start so it spawns detached
        os.system(f"start {executable}")
        return True
    except Exception as e:
        print(f"Error opening {executable}: {e}")
        return False


def close_app(executable: str) -> bool:
    closed_any = False
    for proc in psutil.process_iter(['name']):
        try:
            if proc.info['name'] and proc.info['name'].lower() == executable.lower():
                proc.kill()
                closed_any = True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return closed_any
