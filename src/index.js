require("dotenv").config();
require("promise.allsettled");
const fetch = require("node-fetch");
const { WebClient } = require("@slack/web-api");

const utils = require("./utils");
const projects = require("../config/projects.json");

const slack = new WebClient(process.env.SLACK_TOKEN);

const options = {
  headers: {
    "Circle-Token": process.env.CIRCLE_TOKEN,
  },
};

/**
 * 
 * @param {{error: string}} slackResponse 
 * @param {string} channel 
 */
function sendConfigAlert({ error }, channel) {
  const errorMap = {
    channel_not_found: `@Keira needs to be invited to ${channel} to work`,
    not_in_channel: `Config issue: ${channel} doesn't exist`,
  };

  if (errorMap[error]) {
    return slack.chat.postMessage({
      channel: "#keira-playground",
      text: `${utils.getMessageIcon(error)} ${errorMap[error]}`,
    });
  }
}

/**
 * Send a Slack message to each channel
 *
 * @param {string}    projectId   e.g. 'n-ads-api'
 * @param {string[]}  channels    e.g. ['ads-tech-rota']
 * @param {string}    message     e.g. 'Rate Limit Exceeded', 'Project not found', etc
 */
async function notifySlackChannels(projectId, channels, message) {
  try {
    const notifications = [];
    for (const channel of channels) {
      const icon = utils.getMessageIcon(message);
      const pipelineUrl = utils.getPipelineUrl(projectId);
      const text = `${icon} *<${pipelineUrl}|${projectId}>*: ${message}`;
      notifications.push(slack.chat.postMessage({ channel, text }));
    }

    // Verify that the messages were correctly sent
    const responses = await Promise.allSettled(notifications);
    let channelIndex = 0;
    for (const response of responses) {
      const channel = channels[channelIndex++];
      if (response.status === "rejected") {
        sendConfigAlert(response.reason.data, channel);
      }
    }
  } catch (err) {
    console.log(err);
  }
}

/**
 * Decide whether to send a Slack alert
 * - Is the project misconfigured?
 * - Do nightly build failures exceed the threshold for the period?
 *
 * @param {string} projectId
 * @param {Project} projectConfig
 * @param {Response} response
 */
async function processResponses(projectId, projectConfig, response) {
  const { channels } = projectConfig;
  const { message, items } = await response.json();

  // If `message` exists the repo has issues besides build failures
  if (typeof message === "string") {
    return notifySlackChannels(projectId, channels, message);
  }

  // Send an alert if too many builds are failing
  if (utils.excessiveBuildFailures(items)) {
    return notifySlackChannels(projectId, channels, `Threshold for build errors exceeded`);
  }
}

/**
 * Retrieve records of success/failure for nightly builds
 * of the the specified branch for all projects listed in ../config/projects.json
 * over the last week
 *
 * @param {ProjectMap} projects
 */
async function getProjectBuildStatuses(projects) {
  try {
    const projectIds = Object.keys(projects);
    const requests = projectIds.map((projectId) => {
      const project = projects[projectId];
      const searchParams = utils.buildSearchParams(project);
      const projectUrl = utils.getWorkflowUrl(projectId, searchParams, project.workflow);
      return fetch(projectUrl, options);
    });
    const responses = await Promise.allSettled(requests);

    let index = 0;
    for (const response of responses) {
      if (response.status === "fulfilled") {
        const projectId = projectIds[index++];
        const projectConfig = projects[projectId];
        processResponses(projectId, projectConfig, response.value);
      } else {
        // handle network error
        console.log(response.reason);
      }
    }
  } catch (err) {
    console.log(err);
  }
}

getProjectBuildStatuses(projects);
