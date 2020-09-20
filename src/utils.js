const { GH_BRANCH_DEFAULT } = require("../config/constants.json");

const endpointStem = "https://circleci.com/api/v2/insights/github/Financial-Times";
const pipelineStem = "https://app.circleci.com/pipelines/github/Financial-Times";

/**
 * Inject useful properties
 *
 * @param {ProjectMap} projects
 */
function injectConfig(projects, startDate) {
  const projectDefaults = {
    workflow: "nightly",
    branch: GH_BRANCH_DEFAULT
  };

  return Object.entries(projects).map(([id, project]) => {
    project = { ...projectDefaults, ...project, id };
    project.endpointUrl = getEndpointUrl(project, startDate);
    project.pipelineUrl = `${pipelineStem}/${id}`;

    return project;
  });
}

/**
 * Build the endpoint URL
 *
 * @param {Project} project
 */
function getEndpointUrl(project, startDate) {
  const searchParams = {
    branch: project.branch,
    "start-date": startDate,
  };
  const url = new URL(`${endpointStem}/${project.id}/workflows/${project.workflow}`);

  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
  }

  return url.toString();
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
    unknown_error: "🤷‍♀️",
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
    channel_not_found: `run \`/invite @Keira\` in ${channel}`,
    not_in_channel: `channel ${channel} doesn't exist`,
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
