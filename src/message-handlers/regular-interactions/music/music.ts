import { Guild , Message } from "discord.js";
import { Logger } from "../../../utils/logger";
import { sequence } from "../../../utils/sequencer";
import { Queue } from "./utils/queue";

const queues: Map<string, Queue> = new Map();

async function loadResponse(message: Message, responsePromise: Promise<string>) {
    const outputMessagePromise = message.channel.send(":hourglass:");
    let response;
    try {
        response = await responsePromise;
    } catch (error) {
        const { reason } = error as any;
        if (typeof reason === "string") {
            response = reason;
        } else {
            Logger.error("Unknown error", error);
            response = "An unknown error occurred. Hey <@218737910508158977>, check the error logs.";
        }
    }
    const outputMessage = await outputMessagePromise;
    outputMessage.edit(response);
}

function getQueueObject(guild: Guild) {
    let queue = queues.get(guild.id);
    if (!queue) {
        queue = new Queue(guild);
        queues.set(guild.id, queue);
    }
    return queue;
}

async function playSong(message: Message) {
    const { content } = message;

    const match = content.match(/^[\!]p(?:lay)? (.*)/i);
    if (!match) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);
    const name = match[1];

    await loadResponse(message, queue.enqueueSong(message, name));

    return true;
}

async function playtopSong(message: Message) {
    const { content } = message;

    const match = content.match(/^[\!]p(?:lay)?top (.*)/i);
    if (!match) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);
    const name = match[1];

    await loadResponse(message, queue.enqueueSong(message, name, true));

    return true;
}

async function playRandom(message: Message) {
    const { content } = message;

    if (!content.match(/^[\!](?:p(?:lay)?)?rand(?:om)?/i)) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);

    await loadResponse(message, queue.enqueueRandomSong(message));

    return true;
}

async function playtopRandom(message: Message) {
    const { content } = message;

    if (!content.match(/^[\!](?:p(?:lay)?)?rand(?:om)top?/i)) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);

    await loadResponse(message, queue.enqueueRandomSongTop(message));

    return true;
}

async function skipSong(message: Message) {
    const { content } = message;

    if (!content.match(/^[\!]skip/i)) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);

    await loadResponse(message, queue.skip(message));

    return true;
}

async function nowPlaying(message: Message) {
    const { content } = message;

    if (!content.match(/^[\!]np/i)) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);

    const response = queue.currentlyPlaying();

    message.channel.send(response);

    return true;
}

async function getQueue(message: Message) {
    const { content } = message;

    if (!content.match(/^[\!]q(?:ueue)?/i)) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);

    const response = queue.getQueue();

    message.channel.send(response);

    return true;
}

async function loopQueue(message: Message) {
    const { content } = message;

    if (!content.match(/^[\!]loop(?:queue)?/i)) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);

    const response = queue.toggleLoopQueue();

    message.channel.send(response);

    return true;
}

async function remove(message: Message) {
    const { content } = message;

    const match = content.match(/^[\!]remove (.*)/i);
    if (!match) { return; }
    if (!message.guild) { return; }

    const number = parseInt(match[1], 10);
    if (isNaN(number) || number < 1) {
        message.channel.send("Please specify the number of the song to remove");
        return;
    }

    const queue = getQueueObject(message.guild);

    const response = queue.remove(number);

    message.channel.send(response);

    return true;
}

async function shuffle(message: Message) {
    const { content } = message;

    if (!content.match(/^[\!]shuffle(?:queue)?/i)) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);

    const response = queue.shuffle();

    message.channel.send(response);

    return true;
}

async function save(message: Message) {
    const { content } = message;

    if (!content.match(/^[\!]save/i)) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);

    const response = queue.save();

    message.channel.send(response);

    return true;
}

async function load(message: Message) {
    const { content } = message;

    const match = content.match(/^[\!]load (.*)/i);
    if (!match) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);
    const names = match[1];

    await loadResponse(message, queue.load(message, names));

    return true;
}

function leave(message: Message) {
    const { content } = message;

    if (!content.match(/^[\!]leave/i)) { return; }
    if (!message.guild) { return; }

    const queue = getQueueObject(message.guild);

    const response = queue.leave();

    message.channel.send(response);

    return true;
}

function error(message: Message) {
    const { content } = message;

    if (!content.match(/^[\!]error/i)) { return; }
    if (!message.guild) { return; }

    loadResponse(message, (async () => { throw new Error("woops"); })());

    return true;
}

export const music = sequence([
    playSong,
    playtopSong,
    playRandom,
    playtopRandom,
    skipSong,
    nowPlaying,
    getQueue,
    loopQueue,
    remove,
    shuffle,
    save,
    load,
    leave,
    // error,
]);
