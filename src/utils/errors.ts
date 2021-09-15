export class NoPermissionError extends Error {
    public constructor(public readonly reason: string) {
        super(reason);
    }
}
