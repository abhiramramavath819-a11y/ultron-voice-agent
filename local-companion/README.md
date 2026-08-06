# Local companion

The deployed agent runs in a browser sandbox. It can open web pages, and that is
the limit of what any web page is allowed to do. Launching apps, locking your
screen, changing volume — none of that is reachable from a website, by design.

This small process is the bridge. It runs on your machine, listens on localhost
only, and does a fixed list of things when asked with the right token.

## Run it

```bash
pip install fastapi uvicorn
python agent.py
```

It prints a token. Paste that into the web app once, under **Computer link**.
Nothing works without it.

## Why it is an allowlist and not a shell

The original version of this file ran `os.system()` on strings. Any website you
visited could have asked it to run anything. This version has a fixed table of
argument vectors, `shell=False`, and no interpolation, so the worst a malicious
page can do is open Notepad — and only if it also stole your token.

Adding a capability means editing `COMMANDS` by hand. That inconvenience is the
security model, not an oversight.

## Windows notes

Volume and media keys need extra tooling on Windows and are left unimplemented
rather than half-working: `/health` reports exactly which commands your platform
supports, and the agent is told not to promise the others.
