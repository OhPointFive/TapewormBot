import { Client } from "discord.js";
import { fs } from "mz";
import { TypedJSON } from "typesafe-json";
import { handleMessage } from "./message-handlers";

export async function setUp() {
    const client = new Client();

    client.on("ready", () => { console.log(`Logged in as ${client.user?.tag}!`); });
    client.on("message", async (message) => { await handleMessage(client, message); });
    await logIn(client);
}

async function logIn(client: Client) {
    let tokenBuffer;
    try {
        tokenBuffer = (await fs.readFile("./secret.json"));
    } catch (error) {
        await fs.writeFile("./secret.json", "{ \"token\": \"Paste your bot's secret token between these quotation marks\" }");
        throw new Error("Please add a bot token to secret.json");
    }
    const tokenJSON = TypedJSON.parse(tokenBuffer.toString());
    const token = tokenJSON.get("token").string();
    if (!token) { throw new Error("Token missing"); }
    try {
        await client.login(token);
    } catch (error) {
        console.log("Add your bot's token to secret.json");
        throw error;
    }
}
