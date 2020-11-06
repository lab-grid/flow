

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

export function objectsToCSV<T=any>(objects: T[], objToLine: (obj: T) => string): string {
    return objects.map(objToLine).join('\n');
}

export function exportAsDownload(filename: string, contents: string) {
    const link = document.createElement('a');
    try {
        link.style.display = 'none';
        link.setAttribute('target', '_blank');
        link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(contents));
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
    } finally {
        document.body.removeChild(link);
    }
}
