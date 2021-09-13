import * as yts from "yt-search";
import { addSong } from "./all-songs";

export type VideoInfo = yts.VideoSearchResult;
export type PlaylistInfo = yts.PlaylistMetadataResult;

export function videoIDToName(id: string) {
    return `https://youtube.com/watch?v=${id}`;
}

export async function getPlaylistByID(id: string) {
    const playlist = await yts({ listId: id });
    if (!playlist) { return undefined; }
    const videos = await Promise.all(playlist.videos.map(async (video) => getVideoByID(video.videoId)));
    return { playlist, videos };
}

export function getVideoByID(id: string): Promise<VideoInfo | undefined> {
    const name = videoIDToName(id);
    return getVideo(name);
}

export async function getVideo(name: string): Promise<VideoInfo | undefined> {
    const { videos } = await yts(name);
    for (const video of videos) {
        if (video) {
            addSong(video.videoId);
            return video;
        }
    }
}
