const { DateTime } = require("luxon");

const { ORG, GH_BRANCH_DEFAULT, ERROR_THRESHOLD } = require("../config/constants.json");

function getWorkflowUrl(projectId, searchParams = {}, workflow = "nightly") {
  const endpoint = `insights/${ORG}/${projectId}/workflows/${workflow}`;
  const url = new URL(`https://circleci.com/api/v2/${endpoint}`);

  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
  }

  return url;
}

function getPipelineUrl(projectId) {
  return `https://app.circleci.com/pipelines/${ORG}/${projectId}`;
}

/**
 * Add query params to refine results
 *
 * @param {Project} project
 */
function buildSearchParams(project) {
  const startDate = DateTime.local().minus({ weeks: 1 }).startOf("day").toISO();
  return {
    branch: project.branch || GH_BRANCH_DEFAULT,
    "start-date": startDate,
  };
}

/**
 * Return the appropriate emoji
 *
 * @param {string} message
 */
function getMessageIcon(message) {
  const iconMap = {
    "Project not found": "🤷‍♀️",
    "Rate Limit Exceeded": "🔒",
    "Threshold for build errors exceeded": "💣",
    "channel_not_found": "❌",
    "not_in_channel": "❌"
  };

  return iconMap[message] || "🤔";
}

/**
 * Return `true` if the number of builds is too high for the period
 *
 * @param {Item[]} nightlies
 */
function excessiveBuildFailures(nightlies) {
  const errorNum = nightlies.filter(({ status }) => status === "failed").length;
  return errorNum > ERROR_THRESHOLD;
}

module.exports = {
  getWorkflowUrl,
  getPipelineUrl,
  buildSearchParams,
  getMessageIcon,
  excessiveBuildFailures
};
