**Increment:** 1.7 — Containerise
**Date drafted:** 2026-11-16
**Status:** draft

---

## LinkedIn

I followed my own setup instructions on a fresh copy of my project, and the app
refused to start.

This month I put my task manager into containers: Postgres, a migration job,
the API, and nginx serving the frontend. The last step was the test I'd been
putting off: clone the repo into an empty folder, create the config file from
the template, run one command - as if I were a new teammate, or a new server.

It crashed. The template listed optional settings as `PORT=` - and an empty
value isn't the same as no value. Defaults only apply when a variable is
missing, so `""` reached validation and failed with a message about the port
being less than 1. Worse, an empty `NODE_ENV=` overrode the production setting
baked into the image.

That template had been wrong since September. It never failed on my machine
because my own config file was filled in by hand months ago. My machine was
quietly carrying the setup the repo only claimed to contain.

The fix went into the repo, not my laptop: optional settings commented out
with their defaults, the container pinned to production mode, and an error that
says "set but empty - comment the line out" instead of "must not be less than
1". A second fresh clone then ran both database migrations from an empty
database and the app worked end to end.

A few numbers from the rest of the month:
- Ordering Dockerfile steps for the build cache: a one-line code change went
  from a 2 min 7 s rebuild to 20 s.
- Multi-stage builds: the API image from 1.58 GB to 1.39 GB - smaller than I
  hoped, because a database library's optional dependencies pulled ~170 MB of
  tooling back in. I only found that by measuring inside the image.
- The web image: 82 MB, nginx and static files, no Node at all.

The lesson I'm keeping: test your instructions the way a stranger would use
them, and do it early. "Works on my machine" is often the machine doing work
the repo never wrote down.

Next: CI - building and publishing these images automatically on every merge.

#Docker #DevOps #BuildInPublic #NodeJS

---

## X / Twitter

**1/**
I followed my own setup instructions on a fresh copy of my project.

The app refused to start. 🧵

**2/**
Test: clone into an empty folder, fill config from the template, one command. As if I were a new teammate - or a new server.

**3/**
The template listed optional settings as `PORT=`.

Empty isn't the same as missing. Defaults only apply to missing variables, so `""` hit validation and crashed the API.

**4/**
Worse: an empty `NODE_ENV=` overrode the production setting baked into the container image.

**5/**
It had been wrong since September.

Never failed for me, because my own config was filled in by hand months ago. My machine was carrying setup the repo only claimed to contain.

**6/**
Fixed in the repo, not on my laptop. Then a second fresh clone: both migrations ran on an empty database, app worked end to end.

**7/**
Rest of the month in numbers:
- Cache-ordered Dockerfile: 2 min 7 s → 20 s rebuild
- API image 1.58 GB → 1.39 GB (a dependency dragged 170 MB back in)
- Web image: 82 MB, no Node

**8/**
Test your instructions the way a stranger would. Early.

"Works on my machine" is often the machine doing work the repo never wrote down.

Next: CI.
