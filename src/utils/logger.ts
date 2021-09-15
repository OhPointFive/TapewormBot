import chalk from "chalk";

export class Logger {
    public static info(message: string) {
        console.log(`${chalk.gray(`[${new Date().toISOString()}]`)} ${chalk.gray(`[INFO]: ${message}`)}`);
    }

    public static note(message: string) {
        console.log(`${chalk.gray(`[${new Date().toISOString()}]`)} ${chalk.white(`[NOTE]: ${message}`)}`);
    }

    public static error(message: string) {
        console.log(`${chalk.gray(`[${new Date().toISOString()}]`)} ${chalk.red(`[ERROR]: ${message}`)}`);
    }
}
