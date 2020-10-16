

export function trimEmpty(arr?: string[]): string[] {
    const trimmed: string[] = [];
    if (arr) {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i]) {
                trimmed.push(arr[i]);
            }
        }
    }
    return trimmed;
}
