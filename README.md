# Keira: Nightly build notifications

![Keira Logo](assets/keira-logo.png)

Once a week Keira retrieves data from CircleCI's API on how many times Nightly builds have failed and sends a Slack message to the associated channel if that number is too high.

## Introduction

Projects are configurable: can specify branch and workflow

## Global config

Default branch is "master", but configurable as e.g. "main"