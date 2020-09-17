require("dotenv").config();
require("promise.allsettled");
const fetch = require("node-fetch");
const { DateTime } = require("luxon");

const config = require("../config/constants.json");
const projects = require("../config/projects.json");

const { getUrl, getEndpoint } = require("./utils");

const options = {
  headers: {
    "Circle-Token": process.env.CIRCLE_TOKEN,
  },
};

function getParams() {
  const startDate = DateTime.local().minus({ weeks: 1 }).startOf("day").toISO();
  return {
    branch: config.GH_BRANCH_DEFAULT,
    "start-date": startDate,
  };
}

/**
 * Send a Slack message to each channel that data for projectId is not being returned
 *
 * @param {string}    projectId   e.g. 'n-ads-api'
 * @param {string[]}  channels    e.g. ['ads-tech-rota']
 * @param {string}    message     e.g. 'Rate Limit Exceeded', 'Project not found', etc
 */
function notifySlackChannels(projectId, channels, message) {
  console.log("Send Slack notification", { projectId, channels, message });
}

/**
 * Decide whether to send a Slack alert
 * - Is the project misconfigured?
 * - Is the nightly build failing often enough?
 *
 * @param {string} projectId
 * @param {object} projectConfig
 * @param {Response} value
 */
async function processResponses(projectId, projectConfig, value) {
  const { channels } = projectConfig;
  const { message, items } = await value.json();

  if (typeof message === "string") {
    return notifySlackChannels(projectId, channels, message);
  }

  const errorNum = items.filter(({ status }) => status === "failed").length;

  console.log({ projectId, errorNum });

  if (errorNum > config.ERROR_THRESHOLD) {
    return notifySlackChannels(
      projectId,
      channels,
      `Threshold for build errors (${config.ERROR_THRESHOLD}) exceeded`
    );
  }
}

/**
 * Retrieve records of build success/failure for nightly builds
 * of the the production branch for all projects listed in ../config/projects.json
 * over the last week
 *
 * @param {Config} config
 */
async function getData({ projects, params }) {
  try {
    const projectIds = Object.keys(projects);
    const requests = projectIds.map((projectId) => fetch(getUrl(projectId, params), options));
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

getData({
  projects,
  params: getParams(),
});
