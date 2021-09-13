import { Guild, Message, VoiceChannel } from "discord.js";
import * as fetchVideoUntyped from "youtube-audio-stream";
import { getChannel, getConnection, leaveConnection, playAudioStreamInChannel } from "../../../../utils/play-audio";
import { randomElement, shuffle } from "../../../../utils/random";
import { getRandomSong, removeSong } from "./all-songs";
import { time } from "./time-format";
import { getPlaylistByID, getVideo, getVideoByID, VideoInfo } from "./video-getter";
const fetchVideo = (fetchVideoUntyped as unknown as typeof fetchVideoUntyped.default);

export class Queue {
    public constructor(private readonly guild: Guild) {}

    private nowPlaying: VideoInfo | undefined = undefined;
    private queue: VideoInfo[] = [];
    private loopQueue = false;

    private getChannel(message?: Message) {
        const candidates = [];
        const currentChannel = getChannel(this.guild);
        if (currentChannel) {
            return currentChannel;
        }
        for (const channel of Array.from(this.guild.channels.cache.values())) {
            if (channel.type !== "voice") { continue; }
            const vc = channel as VoiceChannel;
            candidates.push(vc);
            if (message) {
                const membersInChannel = Array.from(channel.members.values());
                if (membersInChannel.map((member) => member.id).includes(message.author.id)) {
                    return vc;
                }
            }
        }
        return randomElement(candidates);
    }

    private async playNextSongInQueue(message?: Message) {
        if (this.loopQueue && this.nowPlaying) { this.queue.push(this.nowPlaying); }

        this.nowPlaying = this.queue.shift();

        if (!this.nowPlaying) {
            const connection = getConnection(this.guild);
            if (connection) { leaveConnection(connection); }
            return;
        }

        const channel = this.getChannel(message);
        // tslint:disable-next-line: no-bitwise
        const stream = fetchVideo(this.nowPlaying!.url, { highWaterMark: 1 << 25 } as any);

        playAudioStreamInChannel(channel, stream).then(() => {
            if (this.loopQueue && this.nowPlaying) {
                this.queue.push(this.nowPlaying);
            }
            this.nowPlaying = undefined;
            this.playNextSongInQueue();
        });
    }

    private songIDList(): string[] {
        return [this.nowPlaying, ...this.queue]
            .filter((a): a is VideoInfo => !!a)
            .map((video) => video.videoId);
    }

    public async enqueueSong(message: Message, name: string, top = false): Promise<string> {
        const playlistMatch = name.match(/list=([^\&]*)/);

        let playlist;
        let playlistLength = 0;
        if (playlistMatch) {
            const listID = playlistMatch[1];
            const result = await getPlaylistByID(listID);
            if (result) {
                let videos;
                ({ playlist, videos } = result);
                for (const video of videos) {
                    if (video) {
                        playlistLength++;
                        if (top) {
                            this.queue.unshift(video);
                        } else {
                            this.queue.push(video);
                        }
                    }
                }
            }
        }

        let video;
        if (!playlist) {
            video = await getVideo(name);
            if (!video) { return `Could not find ${name}`; }
            if (top) {
                this.queue.unshift(video);
            } else {
                this.queue.push(video);
            }
        }

        if (!this.nowPlaying) {
            this.playNextSongInQueue(message);
            if (!this.nowPlaying) {
                return `Could not find ${name}`;
            }
            if (video) {
                return `Now playing ${(this.nowPlaying as VideoInfo).url}`;
            }
        }

        if (video) {
            return `Added ${video.url} to the queue`;
        }

        if (playlist) {
            return `Added ${playlistLength} song${playlistLength === 1 ? "" : "s"} from \`${playlist.title}\` to the queue`;
        }

        return "Something broke but maybe a song will start playing idk";
    }

    public async enqueueRandomSong(message: Message): Promise<string> {
        const name = getRandomSong(this.songIDList());
        if (!name) { return "Couldn't find any songs :("; }
        return this.enqueueSong(message, name);
    }

    public async enqueueRandomSongTop(message: Message): Promise<string> {
        const name = getRandomSong(this.songIDList());
        if (!name) { return "Couldn't find any songs :("; }
        return this.enqueueSong(message, name, true);
    }

    public currentlyPlaying() {
        if (!this.nowPlaying) {
            return "Not playing anything.";
        } else {
            return `Currently playing \`${this.nowPlaying.title}\` [${time(this.nowPlaying.seconds)}]`;
        }
    }

    public skip(message: Message) {
        this.playNextSongInQueue(message);
        return "Skipping...";
    }

    public getQueue() {
        let lines = this.queue.map((video, index) => `**${index + 1})** \`${video.title}\` [${time(video.seconds)}]`);
        const queueSize = lines.length;
        if (queueSize > 10) {
            lines = lines.slice(0, 10);
            lines.push(`... plus ${queueSize - 10} more`);
        }
        return [
            this.currentlyPlaying(),
            "",
            "Up next:",
            ...lines,
            ...(
                this.loopQueue
                    ? [":repeat:"]
                    : []
            ),
        ].join("\n");
    }

    public toggleLoopQueue() {
        this.loopQueue = !this.loopQueue;
        return this.loopQueue ? "Looping!" : "No longer looping.";
    }

    public remove(item: number) {
        const removed = this.queue.splice(item - 1, 1);
        if (removed.length > 0) {
            removeSong(removed[0].videoId);
            return `Removed \`${removed[0].title}\``;
        }
        return `Could not remove ${item}`;
    }

    public shuffle() {
        this.queue = shuffle(this.queue);
        return "Shuffled!";
    }

    public async load(message: Message, names: string) {
        let count = 0;
        for (const name of names.split(",")) {
            const video = await getVideoByID(name);
            if (!video) { continue; }
            this.queue.push(video);
            count++;
        }

        if (!this.nowPlaying) {
            this.playNextSongInQueue(message);
        }

        return `Loaded ${count} song${count === 1 ? "" : "s"}`;
    }

    public save() {
        return `!load ${this.songIDList().join(",")}`;
    }

    public leave() {
        this.nowPlaying = undefined;
        this.queue = [];
        const connection = getConnection(this.guild);
        if (connection) { leaveConnection(connection); }
        return "ok :(";
    }

}
