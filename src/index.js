require("dotenv").config();
require("promise.allsettled");
const fetch = require("node-fetch");
const { DateTime } = require("luxon");

const config = require("../config/constants.json");
const projects = require("../config/projects.json");

const { getUrl } = require("./utils");

const options = {
  headers: {
    "Circle-Token": process.env.CIRCLE_TOKEN,
  },
};

/**
 *
 * @param {Project} project
 */
function buildSearchParams(project) {
  const startDate = DateTime.local().minus({ weeks: 1 }).startOf("day").toISO();
  return {
    branch: project.branch || config.GH_BRANCH_DEFAULT,
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
  console.log("Send Slack notification", { projectId, message, channels });
}

/**
 * Decide whether to send a Slack alert
 * - Is the project misconfigured?
 * - Do nightly build failures exceed the threshold for the period?
 *
 * @param {string} projectId
 * @param {object} projectConfig
 * @param {Response} response
 */
async function processResponses(projectId, projectConfig, response) {
  const { channels } = projectConfig;
  const { message, items } = await response.json();

  if (typeof message === "string") {
    return notifySlackChannels(projectId, channels, message);
  }

  const errorNum = items.filter(({ status }) => status === "failed").length;

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
      const searchParams = buildSearchParams(project);
      const projectUrl = getUrl(projectId, searchParams, project.workflow);
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
