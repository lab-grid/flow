

export function trimEmpty<T=string>(arr?: T[], get?: (input: T) => string): T[] {
    const trimmed: T[] = [];
    const getter = get || ((input: T) => `${input}`);
    if (arr) {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (getter(arr[i])) {
                trimmed.push(arr[i]);
            }
        }
    }
    return trimmed.reverse();
}
