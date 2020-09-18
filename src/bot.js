require("promise.allsettled");
const { WebClient } = require("@slack/web-api");
const { SUPPORT_CHANNEL } = require("../config/constants.json");
const utils = require("./utils");

/**
 *
 * @param {string} token
 */
function createSlackBot(token) {
  const client = new WebClient(token);

  /**
   * There was a problem sending the notification
   * Message Keira's support channel so they can help fix the issue
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
        text: `${utils.getMessageIcon(error)} ${errorMsg}, project.id`,
      });
    }

    /**
     * If this is an error we don't yet handle we should add a case to util.sgetConfigError
     */
    return client.chat.postMessage({
      channel: SUPPORT_CHANNEL,
      text: `${utils.getMessageIcon("unknown")} Seeing a new error: "${error}"`,
    });
  }

  /**
   * Send a Slack message to each channel
   *
   * @param {Project}  project   e.g. ['ads-tech-rota']
   * @param {string}   message   e.g. 'Rate Limit Exceeded', 'Project not found', etc
   * @param {string}   [messageType]
   */
  async function notifyChannels(project, message, messageType) {
    try {
      const notifications = [];
      for (const channel of project.channels) {
        const icon = utils.getMessageIcon(messageType || message);
        const text = `${icon} *<${project.pipelineUrl}|${project.id}>*: ${message}`;
        notifications.push(client.chat.postMessage({ channel, text }));
      }

      // Verify that the messages were correctly sent
      const responses = await Promise.allSettled(notifications);
      let channelIndex = 0;
      for (const response of responses) {
        const channel = project.channels[channelIndex++];
        if (response.status === "rejected") {
          notifySupport(response.reason.data, channel, project);
        }
      }
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
