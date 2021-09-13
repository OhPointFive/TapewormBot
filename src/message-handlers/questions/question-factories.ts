import { Message } from "discord.js";
import { Question } from ".";
import { MaybePromise } from "../../utils/async";

/**
 * Returns a question that never expires.
 */
export function questionForever(question: (message: Message) => MaybePromise<boolean | undefined | void>): Question {
    return async (message: Message) => ({
        shouldRemove: false,
        responded: await question(message),
    });
}

/**
 * Returns a question that persists until it is answered.
 */
export function questionUntilAnswered(
    question: (message: Message) => MaybePromise<boolean | undefined | void>,
): Question {
    return async (message: Message) => {
        const result = await question(message);
        return { shouldRemove: result, responded: result };
    };
}

/**
 * Returns a question that expires after some amount of time.
 */
export function questionWithExpiration(
    timeToExpiry: number,
    question: Question,
): Question {
    const expiryTime = new Date().getTime() + timeToExpiry;
    return (message: Message) => {
        if (new Date().getTime() > expiryTime) {
            return { shouldRemove: true, responded: false };
        }

        return question(message);
    };
}

/**
 * Returns a question that exists until expired on answered.
 */
export function questionUntilExpiredOrAnswered(
    timeToExpiry: number,
    question: (message: Message) => MaybePromise<boolean | undefined | void>,
): Question {
    return questionWithExpiration(timeToExpiry, questionUntilAnswered(question));
}

/**
 * Returns a question that lasts until it is expired, and repeats otherwise.
 */
export function questionUntilExpired(
    timeToExpiry: number,
    question: (message: Message) => MaybePromise<boolean | undefined | void>,
): Question {
    return questionWithExpiration(timeToExpiry, questionForever(question));
}
