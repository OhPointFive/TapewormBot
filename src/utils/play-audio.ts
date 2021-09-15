import { Guild, VoiceChannel, VoiceConnection } from "discord.js";
import * as path from "path";
import { NoPermissionError } from "./errors";

const connections: Map<string, VoiceConnection> = new Map();

export function getConnection(guild: Guild): VoiceConnection | undefined {
    return connections.get(guild.id);
}

export function getChannel(guild: Guild): VoiceChannel | undefined {
    return getConnection(guild)?.channel;
}

export async function joinChannel(channel: VoiceChannel) {
    try {
        const connection = await channel.join();
        connections.set(channel.guild.id, connection);
        return await channel.join();
    } catch (err) {
        console.log(`Tried to join channel ${channel.name} in ${channel.guild.name} but did not have permission.`);
        throw new NoPermissionError(`Didn't have permission to join ${channel.name}`);
    }
}

export async function leaveConnection(connection: VoiceConnection) {
    try {
        connections.delete(connection.channel.guild.id);
        connection.disconnect();
    } catch (err) {
        console.error("Couldn't leave channel.");
        console.error(err);
    }
}

export async function playAudio(connection: VoiceConnection, audio: string) {
    return connection.play(path.join(__dirname, "..", "..", "..", "audio", audio));
}

export async function playAudioInChannel(channel: VoiceChannel, audio: string) {
    if (getConnection(channel.guild)) { return; }
    const connection = await joinChannel(channel);
    if (!connection) { return; }
    const stream = await playAudio(connection, audio);
    stream.on("finish", () => {
        leaveConnection(connection);
    });
}

export async function playAudioStream(connection: VoiceConnection, str: any) {
    return connection.play(str);
}

export async function playAudioStreamInChannel(channel: VoiceChannel, str: any) {
    let connection;
    try {
        connection = await joinChannel(channel);
    } catch (error) {
        return { finished: undefined, error };
    }

    const stream = await playAudioStream(connection, str);
    const finished = new Promise((res) => {
        stream.on("finish", () => {
            res(undefined);
        });
        stream.on("error", (error) => {
            console.error(error);
            res(undefined);
        });
        stream.on("debug", (debug) => {
            console.log(debug);
        });
    });

    return { finished, error: undefined };
}
