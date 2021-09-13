import * as yts from "yt-search";

export async function nameToStandardName(name: string): Promise<string | undefined> {
    if (name.startsWith("www.youtube.com")) {
        return `https://${name}`;
    }
    if (name.startsWith("youtube.com")) {
        return `https://${name}`;
    }
    if (name.startsWith("https://")) {
        return name;
    }

    const { videos } = await yts(name);
    for (const video of videos) {
        if (video.url) { return video.url; }
    }
}
