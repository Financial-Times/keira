const { DateTime } = require("luxon");

const { injectConfig, endpointStem, pipelineStem } = require("../utils");
const { projectMap } = require("../__fixtures__/projects");

function getProjects() {
  const date = encodeURIComponent(DateTime.local().minus({ weeks: 1 }).startOf("day").toISO());

  return [
    {
      id: "next-consent-proxy",
      channels: ["#ads-tech-rota", "#keira-playground", "#foo"],
      endpointUrl: `${endpointStem}/next-consent-proxy/workflows/nightly?branch=master&start-date=${date}`,
      pipelineUrl: `${pipelineStem}/next-consent-proxy`,
    },
    {
      id: "next-ads-api",
      channels: ["#ads-tech-rota"],
      endpointUrl: `${endpointStem}/next-ads-api/workflows/nightly?branch=master&start-date=${date}`,
      pipelineUrl: `${pipelineStem}/next-ads-api`,
    },
    {
      id: "n-ads-api",
      channels: ["#ads-tech-rota"],
      endpointUrl: `${endpointStem}/n-ads-api/workflows/nightly?branch=master&start-date=${date}`,
      pipelineUrl: `${pipelineStem}/n-ads-api`,
    },
    {
      id: "n-syndication",
      channels: [],
      branch: "development",
      workflow: "build-test-provision",
      endpointUrl: `${endpointStem}/n-syndication/workflows/build-test-provision?branch=development&start-date=${date}`,
      pipelineUrl: `${pipelineStem}/n-syndication`,
    },
  ];
}

describe("injectConfig", () => {
  it("decorates project configs with extra data", () => {
    expect(injectConfig(projectMap)).toEqual(getProjects());
  });
});
