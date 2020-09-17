const { ORG } = require("../config/constants.json");

function getUrl(project, qs = {}) {
  const endpoint = `insights/${ORG}/${project}/workflows/nightly`;
  const url = new URL(`https://circleci.com/api/v2/${endpoint}`);

  for (const [k, v] of Object.entries(qs)) {
    url.searchParams.set(k, v);
  }

  return url;
}

module.exports = {
  getUrl
};
