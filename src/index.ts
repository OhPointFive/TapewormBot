import { addSpeechEvent, VoiceMessage } from "discord-speech-recognition";
import { Client, Intents } from "discord.js";
import { fs } from "mz";
import { TypedJSON } from "typesafe-json";
import { handleMessage } from "./message-handlers";
import { Logger } from "./utils/logger";

export async function setUp() {
    const client = new Client({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_VOICE_STATES,
            Intents.FLAGS.GUILD_MESSAGES,
        ],
    });
    addSpeechEvent(client);

    client.on("ready", () => {
        Logger.note(`Logged in as ${client.user?.tag}!`);
        client.user?.setActivity({
            name: "!help",
            url: "http://bot.tpwm.club",
            type: "PLAYING",
        });
    });
    client.on("messageCreate", async (message) => { await handleMessage(client, message); });
    client.on("speech", (message: VoiceMessage) => {
        console.log(`${message.author.username}: ${message.content}`);
    });
    await logIn(client);
}

async function logIn(client: Client) {
    let tokenBuffer;
    try {
        tokenBuffer = (await fs.readFile("./secret.json"));
    } catch (error) {
        await fs.writeFile("./secret.json", "{ \"token\": \"Paste your bot's secret token between these quotation marks\" }");
        Logger.error("Add a bot token to secret.json");
        throw new Error("Please add a bot token to secret.json");
    }
    const tokenJSON = TypedJSON.parse(tokenBuffer.toString());
    const token = tokenJSON.get("token").string();
    if (!token) { throw new Error("Token missing"); }
    try {
        await client.login(token);
    } catch (error) {
        Logger.error("Add your bot's token to secret.json");
        throw error;
    }
}
