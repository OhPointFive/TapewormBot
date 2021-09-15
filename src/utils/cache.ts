import { readFileSync, writeFile } from "fs";
import { Logger } from "./logger";

let dataStore: any = {};

try {
    const file = readFileSync("./data.json", "utf8");
    dataStore = JSON.parse(file);
} catch {
    Logger.note("Could not load cache.");
}

export async function setData(keys: (string | number)[], value: any) {
    let item = dataStore;
    let i;
    for (i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in item)) {
            if (typeof keys[i + 1] === "string") {
                item[keys[i]] = {};
            } else {
                item[keys[i]] = [];
            }
        }
        item = item[keys[i]];
    }
    if (keys[i] === -1) {
        item.push(value);
    } else {
        item[keys[i]] = value;
    }
    await saveData();
}

export function data(...keys: (string | number)[]) {
    let item = dataStore;
    let i;
    for (i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in item)) {
            if (typeof keys[i + 1] === "string") {
                item[keys[i]] = {};
            } else {
                item[keys[i]] = [];
            }
        }
        item = item[keys[i]];
    }
    return item[keys[i]];
}

export function saveData() {
    const text = JSON.stringify(dataStore, null, 4);
    return new Promise((resolve) => {
        writeFile("./data.json", text, () => {
            resolve(undefined);
        });
    });
}
