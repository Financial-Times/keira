const { DateTime } = require("luxon");
const { WebClient } = require("@slack/web-api");

const { createSlackBot } = require("../bot");
const { endpointStem, pipelineStem } = require("../utils");
const constants = require("../../config/constants.json");

describe("index", () => {
  let slackBot;
  let client;
  const mockSlackErrorResponse = (errorId) => ({
    data: {
      error: errorId,
    },
  });

  beforeEach(() => {
    WebClient.mockClear();

    slackBot = createSlackBot("TOKEN");
    client = WebClient.mock.instances[0];
  });

  describe("notifySupport", () => {
    it("Handles known errors", () => {
      slackBot.notifySupport({ error: "channel_not_found" }, "#TEST");
      expect(client.chat.postMessage).toHaveBeenCalledWith({
        channel: constants.SUPPORT_CHANNEL,
        text: "❌ @Keira needs to be invited to #TEST to work",
      });
    });

    it("Handles unknown errors", () => {
      slackBot.notifySupport({ error: "MOCK_ERROR" }, "#TEST");
      expect(client.chat.postMessage).toHaveBeenCalledWith({
        channel: constants.SUPPORT_CHANNEL,
        text: '🤷‍♀️ Seeing a new error: "MOCK_ERROR"',
      });
    });
  });

  describe("notifyChannels", () => {
    const date = encodeURIComponent(DateTime.local().minus({ weeks: 1 }).startOf("day").toISO());
    const project = {
      id: "mock-project",
      channels: ["#ads-tech-rota", "#keira-playground", "#foo"],
      branch: "development",
      workflow: "build-test-provision",
      endpointUrl: `${endpointStem}/n-syndication/workflows/build-test-provision?branch=development&start-date=${date}`,
      pipelineUrl: `${pipelineStem}/n-syndication`,
    };

    it("notifies once per channel", async () => {
      await slackBot.notifyChannels(project, "mock message", "mock_message_type");
      expect(client.chat.postMessage).toHaveBeenCalledTimes(3);
    });

    it("notifies support in case of failure to post to Slack", async () => {
      project.channels = ["#ads-tech-rota"]
      const mockError = "channel_not_found";
      client.chat.postMessage = jest.fn(() => Promise.reject(mockSlackErrorResponse(mockError)));

      await slackBot.notifyChannels(project, mockError);

      // Expect 2 calls per channel: once to try the channel, once to ping support
      expect(client.chat.postMessage).toHaveBeenCalledTimes(2);
    });
  });
});
