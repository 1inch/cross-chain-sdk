/**
 * Return current UNIX timestamp in seconds
 */
export function now(): number {
    return Math.floor(Date.now() / 1000)
}
