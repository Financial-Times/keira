require("promise.allsettled");
const { WebClient } = require("@slack/web-api");
const { SUPPORT_CHANNEL } = require("../config/constants.json");
const utils = require("./utils");

/**
 * @param {Project} project
 * @param {string} message
 * @param {string} [messageType]
 */
function makeChannelText(project, message, messageType) {
  const icon = utils.getMessageIcon(messageType || message);
  return `${icon} *<${project.pipelineUrl}|${project.id}>*: ${message}`;
}

/**
 * @param {Project} project
 * @param {string} channel
 * @param {string} message
 */
function makeSupportText(project, channel, message) {
  return `:slack: cannot message ${channel} about ${project.id} - ${message}`;
}

/**
 * @param {string} slackToken
 * @returns SlackBot
 */
function createSlackBot(slackToken) {
  const client = new WebClient(slackToken);

  /**
   * There was a problem sending the notification
   * Message Keira's support channel so they can help the maintaining team fix the issue
   *
   * @param {{error: string}} slackResponse
   * @param {string} channel
   * @param {Project} project
   */
  function notifySupport({ error }, channel, project) {
    const errorMsg = utils.getConfigError(error, channel);
    if (errorMsg) {
      return client.chat.postMessage({
        channel: SUPPORT_CHANNEL,
        text: makeSupportText(project, channel, errorMsg, error),
      });
    }

    // If errorMsg === undefined then this is a type of error we haven't seen before
    // We should add a case to utils.getConfigError to handle it
    return client.chat.postMessage({
      channel: SUPPORT_CHANNEL,
      text: makeSupportText(project, channel, `Seeing a new error: "${error}"`),
    });
  }

  /**
   * Send a Slack message to each channel
   *
   * @param {Project}  project
   * @param {string}   message   e.g. 'Rate Limit Exceeded', 'Project not found', etc
   * @param {string}   [messageType]
   */
  async function notifyChannels(project, message, messageType) {
    try {
      const notifications = [];
      for (const channel of project.channels) {
        notifications.push(
          client.chat.postMessage({ channel, text: makeChannelText(project, message, messageType) })
        );
      }

      // Verify that the messages were correctly sent
      const responses = await Promise.allSettled(notifications);
      let channelIndex = 0;
      const supportMessages = [];
      for (const response of responses) {
        const channel = project.channels[channelIndex++];
        if (response.status === "rejected") {
          supportMessages.push(notifySupport(response.reason.data, channel, project));
        }
      }

      return Promise.allSettled(supportMessages);
    } catch (err) {
      console.log(err);
    }
  }

  return {
    notifySupport,
    notifyChannels,
  };
}

module.exports = {
  createSlackBot,
};
