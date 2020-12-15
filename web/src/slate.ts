import { Node } from 'slate';

export function serializeSlate(value: Node[]): string {
    return JSON.stringify(value);
}

export function serializeSlateToText(value: Node[]): string {
    return value
        // Return the string content of each paragraph in the value's children.
        .map(n => Node.string(n))
        // Join them all with line breaks denoting paragraphs.
        .join('\n');
}

export function deserializeSlate(str: string): Node[] {
    return JSON.parse(str);
}

export function deserializeSlateFromText(str: string): Node[] {
    // Return a value array of children derived by splitting the string.
    return str.split('\n').map(line => {
        return {
            children: [{ text: line }],
        }
    })
}

export const initialSlateValue: Node[] = [
    {
        type: 'paragraph',
        children: [
            { text: '' }
        ],
    }
];
