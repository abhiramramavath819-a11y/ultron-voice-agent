# Legacy local agent

This is the original FastAPI backend, preserved unchanged.

It is **not** deployed to Vercel, and cannot be. It uses `psutil.kill()` and
`os.system("start notepad.exe")` to control processes on the machine it runs on.
On Vercel that machine is an ephemeral Linux container in a datacenter, not your
laptop — so launching Notepad there does nothing you could observe, on a box that
is destroyed seconds later.

Process control only makes sense as software running on your own computer. If you
want it back, run this locally alongside the deployed agent:

    cd legacy-local-agent
    pip install fastapi uvicorn psutil
    python app.py

Then have the browser call `http://localhost:8000/api/command` for the
open/close intents specifically, while everything else goes to the cloud agent.

Security note: this endpoint kills and launches processes with no authentication.
Bind it to localhost only. Never expose it to the internet.
