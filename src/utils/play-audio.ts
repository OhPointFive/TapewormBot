import { AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { Guild, VoiceChannel } from "discord.js";
import { WriteStream } from "mz/fs";
import * as path from "path";

const connections: Map<string, VoiceConnection> = new Map();

export function getConnection(guild: Guild): VoiceConnection | undefined {
    return connections.get(guild.id);
}

export function getChannel(guild: Guild): VoiceChannel | undefined {
    return guild.channels.cache.get(getConnection(guild)?.joinConfig.channelId || "") as VoiceChannel;
}

export function joinChannel(channel: VoiceChannel) {
    try {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator as any,
        });
        connections.set(channel.guild.id, connection);
        return connection;
    } catch (err) {
        console.log(`Tried to join channel ${channel.name} in ${channel.guild.name} but did not have permission.`);
    }
}

export async function leaveConnection(connection: VoiceConnection) {
    try {
        connections.delete(connection.joinConfig.guildId);
        connection.disconnect();
    } catch (err) {
        console.error("Couldn't leave channel.");
        console.error(err);
    }
}

export async function playAudio(connection: VoiceConnection, audio: string) {
    const player = createAudioPlayer();
    player.play(createAudioResource(path.join(__dirname, "..", "..", "..", "audio", audio)));
    connection.subscribe(player);
    return player;
}

export async function playAudioInChannel(channel: VoiceChannel, audio: string) {
    if (getConnection(channel.guild)) { return; }
    const connection = joinChannel(channel);
    if (!connection) { return; }
    const stream = await playAudio(connection, audio);
    stream.on(AudioPlayerStatus.Idle, () => {
        leaveConnection(connection);
    });
}

export async function playAudioStream(connection: VoiceConnection, str: WriteStream) {
    const player = createAudioPlayer();
    player.play(createAudioResource(str as any));
    connection.subscribe(player);
    return player;
}

export async function playAudioStreamInChannel(channel: VoiceChannel, str: any) {
    let connection;
    try {
        connection = await joinChannel(channel);
        if (!connection) { throw new Error("Could not connect!"); }
    } catch (error) {
        return { finished: undefined, error };
    }
    const stream = await playAudioStream(connection, str);
    const finished = new Promise((res) => {
        stream.on(AudioPlayerStatus.Idle, () => {
            res({ error: null, finished: true });
        });
    });


    return { finished, error: undefined };
}
