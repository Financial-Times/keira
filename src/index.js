require("dotenv").config();
require("promise.allsettled");
const { DateTime } = require("luxon");
const fetch = require("node-fetch");

const utils = require("./utils");
const { createSlackBot } = require("./bot");

const projects = require("../config/projects.json");
const { ERROR_THRESHOLD } = require("../config/constants.json");

const slackBot = createSlackBot(process.env.SLACK_TOKEN);
const requestOptions = {
  headers: { "Circle-Token": process.env.CIRCLE_TOKEN },
};
const startDate = DateTime.local().minus({ weeks: 1 }).startOf("day");
const readableDate = startDate.toLocaleString(DateTime.DATE_FULL);

/**
 * Decide whether to send a Slack alert
 * - Is the project misconfigured?
 * - Do nightly build failures exceed the threshold for the period?
 *
 * @param {Project} project
 * @param {Response} response
 */
async function processResponse(project, response) {
  /** @type {{message: string, items: Item[]}} */
  const { message, items } = await response.json();

  // If `message` exists the repo has issues besides build failures
  // Send a message notifying the channel that they should address this
  if (typeof message === "string") {
    return slackBot.notifyChannels(project, message);
  }

  // Send an alert if too many builds are failing
  const errorNum = items.filter(({ status }) => status === "failed").length;
  if (errorNum > ERROR_THRESHOLD) {
    return slackBot.notifyChannels(
      project,
      `\`${project.workflow}\` failed ${errorNum} times since ${readableDate}`,
      "excessive_failures"
    );
  }
}

/**
 * Stub: consider a fuller logging solution
 *
 * @param {string} error
 */
function handleNetworkError(error) {
  console.log(error);
}

/**
 * 1. Retrieve records of success/failure for nightly builds over the last week
 * 2. On retrieval determine whether to notify of errors via Slack
 *
 * @param {Project[]} projects
 */
async function getProjectBuildStatuses(projects) {
  try {
    const requests = projects.map((project) => fetch(project.endpointUrl, requestOptions));
    const responses = await Promise.allSettled(requests);

    let index = 0;
    for (const response of responses) {
      response.status === "fulfilled"
        ? processResponse(projects[index++], response.value)
        : handleNetworkError(response.reason);
    }
  } catch (err) {
    console.log(err);
  }
}

getProjectBuildStatuses(utils.injectConfig(projects, startDate.toISO()));
