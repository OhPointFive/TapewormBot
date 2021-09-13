export function randomElement<T>(array: readonly T[]) {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}

export function weightedRandomElement<T>(array: readonly (readonly [number, T])[]) {
    const total = array.reduce((a, b) => a + b[0], 0);
    const weight = Math.random() * total;

    let runningTotal = 0;
    for (const item of array) {
        runningTotal += item[0];
        if (runningTotal > weight) {
            return item[1];
        }
    }
    throw new Error("This code should be unreachable");
}

export function chance(probability: number) {
    return Math.random() < probability;
}

export function randomIn(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    const result = [];
    while (copy.length) {
        result.push(copy.splice(randomIn(0, copy.length), 1)[0]);
    }
    return result;
}
