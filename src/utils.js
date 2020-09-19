const { DateTime } = require("luxon");

const { GH_BRANCH_DEFAULT } = require("../config/constants.json");

const endpointStem = "https://circleci.com/api/v2/insights/github/Financial-Times";
const pipelineStem = "https://app.circleci.com/pipelines/github/Financial-Times";

/**
 * Inject useful properties
 *
 * @param {ProjectMap} projects
 */
function injectConfig(projects) {
  return Object.entries(projects).map(([id, project]) => {
    const searchParams = getSearchParams(project.branch);
    const endpointUrl = getEndpointUrl(id, searchParams, project.workflow);
    const pipelineUrl = `${pipelineStem}/${id}`;

    return {
      id,
      endpointUrl,
      pipelineUrl,
      ...project,
    };
  });
}

/**
 * Build the endpoint URL
 *
 * @param {string} projectId
 * @param {Record<string, string>} searchParams
 * @param {string} workflow
 */
function getEndpointUrl(projectId, searchParams = {}, workflow = "nightly") {
  const url = new URL(`${endpointStem}/${projectId}/workflows/${workflow}`);

  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
  }

  return url.toString();
}

/**
 * Add query params to constrain results to branch and reporting period
 */
function getSearchParams(branch = GH_BRANCH_DEFAULT) {
  return {
    branch,
    "start-date": DateTime.local().minus({ weeks: 1 }).startOf("day").toISO(),
  };
}

/**
 * Return the appropriate emoji
 *
 * @param {string} message
 * @returns {string}
 */
function getMessageIcon(message) {
  /** @type Record<string, string> */
  const iconMap = {
    "Project not found": "🤷‍♀️",
    "Rate Limit Exceeded": "🔒",
    excessive_failures: "💣",
    channel_not_found: "❌",
    not_in_channel: "❌",
    unknown: "🤷‍♀️",
  };

  return iconMap[message] || "🤔";
}

/**
 * Return standardised messaging
 *
 * @param {string} errorId
 * @param {string} channel
 */
function getConfigError(errorId, channel) {
  /** @type Record<string, string> */
  const errorMap = {
    channel_not_found: `@Keira needs to be invited to ${channel} to work`,
    not_in_channel: `Config issue: ${channel} doesn't exist`,
  };

  return errorMap[errorId];
}

module.exports = {
  endpointStem,
  pipelineStem,
  injectConfig,
  getMessageIcon,
  getConfigError,
};
