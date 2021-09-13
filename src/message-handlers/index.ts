import { Client, Message } from "discord.js";
import { sequence } from "../utils/sequencer";
import { handleQuestionResponse } from "./questions";
import { music } from "./regular-interactions/music/music";

export async function handleMessage(client: Client, message: Message) {
    const user = client.user;
    if (!user) { return false; }
    if (message.author.equals(user)) { return; }

    await sequence([

        // Question handling
        handleQuestionResponse,

        // Music bot
        music,

    ])(message);
}
