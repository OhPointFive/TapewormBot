import { data, setData } from "../../../../utils/cache";
import { randomElement } from "../../../../utils/random";
import { videoIDToName } from "./video-getter";

export function getRandomSong(exclude?: string[]) {
    let songs: string[] = data("allsongs") ?? [];
    const excludeSet = new Set(exclude);
    songs = songs.filter((a) => !excludeSet.has(a));
    if (songs.length === 0) { return undefined; }
    return videoIDToName(randomElement(songs));
}

export function addSong(song: string) {
    const songs: string[] = data("allsongs") ?? [];
    if (songs.includes(song)) { return; }
    songs.push(song);
    setData(["allsongs"], songs);
}

export function removeSong(song: string) {
    let songs: string[] = data("allsongs") ?? [];
    songs = songs.filter((a) => a !== song);
    setData(["allsongs"], songs);
}
