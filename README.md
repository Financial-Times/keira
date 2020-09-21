![Keira logo](assets/keira-logo.png)

# Keira: Nightly build notifications

Once a week Keira retrieves data from CircleCI's API on how many times Nightly builds have failed and sends a Slack message to the associated channels if that number is too high.

The intention is to keep teams informed about older, less well-known, or less active projects which may start to degrade.

## How Keira works
1. The Circle CI API is queried for the status of configured projects
2. If there have been too many build failures over the past week reports are sent to the channels associated with that project. Currently the threshold is 4
3. Other issues reported by the API are reported automatically

In the case of failure to send the Slack message, the support channel (currently [`#keira-playground`](https://financialtimes.slack.com/archives/C01AF5GPKN3)) is notified. 

## Installation
1. ```sh
   git clone git@github.com:Financial-Times/keira.git
   cd keira
   npm install
   ```
2. In LastPass find `Shared-Next/Keira .env` and copy the contents to a local `.env` file in the root of the project:
    ```sh
    # .env
    CIRCLE_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    SLACK_TOKEN=xoxb-xxxxxxxxxx-xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx
    ```

Run `node src/index` to trigger a report.

## Configuration
Projects to be checked are listed in `config/projects.json`.

The minimal required config for a project looks like this:
```json
{
  "next-consent-proxy": {
    "channels": ["#ads-tech-rota"]
  }
}
```

More options are available:
```json5
{
  "next-consent-proxy": {
    "channels": ["#ads-tech-rota"]     // List as many as required
    "branch": "main"                   // The current default is "master"
    "workflow": "build-test-provision" // Any workflow can be watched
  }
}
```

## Immediate priorities
- [x] Add .env keys to LastPass
- [ ] Automate running Keira weekly. Sam Parkinson has suggested using a Circle CI job 
- [ ] Add logging
- [ ] More test coverage
