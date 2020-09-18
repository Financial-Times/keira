<center><img src="assets/keira-logo.png"/></center>

# Keira: Nightly build notifications

Once a week Keira retrieves data from CircleCI's API on how many times Nightly builds have failed and sends a Slack message to the associated channels if that number is too high.

## Introduction

Projects are configurable: can specify branch and workflow

## Global config

Default branch is "master", but configurable as e.g. "main"

## Installation

1. In LastPass find `Shared-Next/Keira .env` and copy the contents to a local `.env` file in the root of the project:
    ```sh
    # .env
    CIRCLE_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    SLACK_TOKEN=xoxb-xxxxxxxxxx-xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx
    ```
2. 

## Immediate priorities

- [x] Add .env keys to LastPass
- [ ] Decide on hosting: Lambda?
- [ ] Add logging