export function time(seconds: number) {
    const minutes = `${Math.floor(seconds / 60)}`;
    const secondsString = `${Math.floor(seconds % 60)}`.padStart(2, "0");
    return `${minutes}:${secondsString}`;
}
