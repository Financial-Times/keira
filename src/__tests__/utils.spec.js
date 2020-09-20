const { DateTime } = require("luxon");

const { injectConfig, endpointStem, pipelineStem } = require("../utils");
const { projectMap } = require("../__fixtures__/projects");

function getProjects(startDate) {
  return [
    {
      id: "next-consent-proxy",
      channels: ["#ads-tech-rota", "#keira-playground", "#foo"],
      branch: "master",
      workflow: "nightly",
      endpointUrl: `${endpointStem}/next-consent-proxy/workflows/nightly?branch=master&start-date=${startDate}`,
      pipelineUrl: `${pipelineStem}/next-consent-proxy`,
    },
    {
      id: "next-ads-api",
      channels: ["#ads-tech-rota"],
      branch: "master",
      workflow: "nightly",
      endpointUrl: `${endpointStem}/next-ads-api/workflows/nightly?branch=master&start-date=${startDate}`,
      pipelineUrl: `${pipelineStem}/next-ads-api`,
    },
    {
      id: "n-ads-api",
      channels: ["#ads-tech-rota"],
      branch: "master",
      workflow: "nightly",
      endpointUrl: `${endpointStem}/n-ads-api/workflows/nightly?branch=master&start-date=${startDate}`,
      pipelineUrl: `${pipelineStem}/n-ads-api`,
    },
    // Custom branch and workflow
    {
      id: "n-syndication",
      channels: [],
      branch: "development",
      workflow: "build-test-provision",
      endpointUrl: `${endpointStem}/n-syndication/workflows/build-test-provision?branch=development&start-date=${startDate}`,
      pipelineUrl: `${pipelineStem}/n-syndication`,
    },
  ];
}

describe("injectConfig", () => {
  it("decorates project configs with extra data", () => {
    const startDate = DateTime.local().minus({ weeks: 1 }).startOf("day").toISO();
    expect(injectConfig(projectMap, startDate)).toEqual(getProjects(encodeURIComponent(startDate)));
  });
});
