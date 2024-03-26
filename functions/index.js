const { onRequest } = require("firebase-functions/v2/https");
const axios = require("axios");

const LINE_MESSAGING_API = "https://api.line.me/v2/bot";
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
};


async function getWordDefinition(word) {
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    const data = response.data;

    if (data && data.length > 0) {
      const nounDefinition = data[0].meanings.find((meaning) => meaning.partOfSpeech === "noun")?.definitions[0]?.definition;
      const verbDefinition = data[0].meanings.find((meaning) => meaning.partOfSpeech === "verb")?.definitions[0]?.definition;

      const nounOutput = nounDefinition ? `Noun: ${nounDefinition}` : "";
      const verbOutput = verbDefinition ? `Verb: ${verbDefinition}` : "";

      return `${nounOutput}\n${verbOutput}`.trim();
    } else {
      return "No definitions found for the given word.";
    }
  } catch (error) {
    console.error("Error fetching word definition:", error);
    return "Error retrieving word definition.";
  }
}

// Function to handle incoming messages from the Line Bot
async function handleMessage(event, client) {
  const word = event.message.text.toLowerCase();

  const definition = await getWordDefinition(word);

  const replyToken = event.replyToken;
  client(replyToken, {
    type: "text",
    text: definition,
  });
}

exports.lineChatbot = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }
      const events = request.body.events;
      for (const event of events) {
        switch (event.type) {
          case "message":
            if (event.message.type === "text") {
                await handleMessage(event, client);
            }
            break;
        }
      }
  response.status(200).send("OK");
});

const client = (token, payload) => {
  return axios({
    method: "post",
    url: `${LINE_MESSAGING_API}/message/reply`,
    headers: LINE_HEADER,
    data: { replyToken: token, messages: [payload]},
  });
};