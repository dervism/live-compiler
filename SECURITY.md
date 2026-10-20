# Security policy

## Reporting a vulnerability

Please don't open a public issue. Report it privately through GitHub instead: open the repository's **Security** tab and choose **Report a vulnerability**. Include the steps to reproduce it and what an attacker could gain.

Fixes go to the `main` branch, which is the only supported version.

## What's in scope

The part that matters most is the optional language-server setup in `lsp/`. It runs language servers on your computer, so it must never be reachable by other machines or by websites you visit. It's designed so that:

- the gateway listens on 127.0.0.1 only, and is the only container with a published port;
- every WebSocket needs the access token, and `/token` hands it out only to the page the gateway serves itself;
- requests whose `Host` header isn't localhost are refused, which blocks DNS rebinding;
- only `file://` pages and `http://localhost` / `http://127.0.0.1` origins may connect;
- the language containers sit on an internal Docker network with no internet access, and run as an unprivileged user.

A way around any of these is a vulnerability. So is a way for a web page to get code from the app sent anywhere other than compiler-explorer.com and your own language servers.

## Out of scope

- compiler-explorer.com and the Compiler Explorer API itself: please report those to [Compiler Explorer](https://github.com/compiler-explorer/compiler-explorer).
- Problems that need the gateway to be exposed on purpose, for example by publishing its port on `0.0.0.0` or adding remote origins to `ALLOWED_ORIGINS`.
