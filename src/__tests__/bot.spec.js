const { DateTime } = require("luxon");
const { WebClient } = require("@slack/web-api");

const { createSlackBot } = require("../bot");
const { endpointStem, pipelineStem } = require("../utils");
const constants = require("../../config/constants.json");

describe("index", () => {
  /** @type SlackBot */
  let slackBot;
  let client;
  const mockSlackErrorResponse = (errorId) => ({
    data: {
      error: errorId,
    },
  });

  const date = DateTime.local().minus({ weeks: 1 }).startOf("day").toISO();
  const dateEncoded = encodeURIComponent(date);

  beforeEach(() => {
    WebClient.mockClear();

    slackBot = createSlackBot("TOKEN");
    client = WebClient.mock.instances[0];
  });

  describe("notifySupport", () => {
    const project = {
      id: "mock-project",
      channels: ["#ads-tech-rota", "#keira-playground", "#foo"],
      branch: "development",
      workflow: "nightly",
      endpointUrl: `${endpointStem}/mock-project/workflows/build-test-provision?branch=development&start-date=${dateEncoded}`,
      pipelineUrl: `${pipelineStem}/mock-project`,
      startDate: date,
    };

    it("Handles known errors", () => {
      slackBot.notifySupport({ error: "channel_not_found" }, "#TEST", project);
      expect(client.chat.postMessage).toHaveBeenCalledWith({
        channel: constants.SUPPORT_CHANNEL,
        text:
          ":slack: cannot message #TEST about mock-project - run `/invite @Keira` in #TEST",
      });
    });

    it("Handles unknown errors", () => {
      slackBot.notifySupport({ error: "MOCK_ERROR" }, "#TEST", project);
      expect(client.chat.postMessage).toHaveBeenCalledWith({
        channel: constants.SUPPORT_CHANNEL,
        text: ':slack: cannot message #TEST about mock-project - Seeing a new error: "MOCK_ERROR"',
      });
    });
  });

  describe("notifyChannels", () => {
    const project = {
      id: "mock-project",
      channels: ["#channel1", "#channel2"],
      branch: "development",
      workflow: "build-test-provision",
      endpointUrl: `${endpointStem}/mock-project/workflows/build-test-provision?branch=development&start-date=${dateEncoded}`,
      pipelineUrl: `${pipelineStem}/mock-project`,
      startDate: date,
    };

    it("notifies each channel", async () => {
      await slackBot.notifyChannels(
        project,
        "`build-test-provision` failed 5 times in the last week",
        "excessive_failures"
      );
      expect(client.chat.postMessage.mock.calls).toEqual([
        [
          {
            channel: "#channel1",
            text:
              "💣 *<https://app.circleci.com/pipelines/github/Financial-Times/mock-project|mock-project>*: `build-test-provision` failed 5 times in the last week",
          },
        ],
        [
          {
            channel: "#channel2",
            text:
              "💣 *<https://app.circleci.com/pipelines/github/Financial-Times/mock-project|mock-project>*: `build-test-provision` failed 5 times in the last week",
          },
        ],
      ]);
    });

    it("notifies support in case of failure to post to Slack", async () => {
      const mockError = "channel_not_found";
      client.chat.postMessage = jest.fn(() => Promise.reject(mockSlackErrorResponse(mockError)));

      await slackBot.notifyChannels(project, mockError);

      // Expect 2 calls per channel: once to try the channel, once to ping support
      expect(client.chat.postMessage.mock.calls).toEqual([
        [
          {
            channel: "#channel1",
            text:
              "❌ *<https://app.circleci.com/pipelines/github/Financial-Times/mock-project|mock-project>*: channel_not_found",
          },
        ],
        [
          {
            channel: "#channel2",
            text:
              "❌ *<https://app.circleci.com/pipelines/github/Financial-Times/mock-project|mock-project>*: channel_not_found",
          },
        ],
        [
          {
            channel: "#keira-playground",
            text:
              ":slack: cannot message #channel1 about mock-project - run `/invite @Keira` in #channel1",
          },
        ],
        [
          {
            channel: "#keira-playground",
            text:
              ":slack: cannot message #channel2 about mock-project - run `/invite @Keira` in #channel2",
          },
        ],
      ]);
    });
  });
});
