const { ORG } = require("../config/constants.json");

function getUrl(projectId, searchParams = {}, workflow = "nightly") {
  const endpoint = `insights/${ORG}/${projectId}/workflows/${workflow}`;
  const url = new URL(`https://circleci.com/api/v2/${endpoint}`);

  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
  }

  return url;
}

module.exports = {
  getUrl,
};
