export function isBigintString(value: string): boolean {
    return /^\d+$/.test(value)
}
