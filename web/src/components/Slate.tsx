import React from "react"
import { Button } from "react-bootstrap"
import { TypeBold, TypeItalic, TypeUnderline, Code, TypeH1, TypeH2, TypeH3, BlockquoteLeft, ListOl, ListUl } from "react-bootstrap-icons"
import { Editor, Transforms } from "slate"
import { RenderElementProps, RenderLeafProps, useSlate } from "slate-react"

const LIST_TYPES = ['numbered-list', 'bulleted-list']

function isBlockActive(editor: Editor, format: string) {
    const [match] = Editor.nodes(editor, {
        match: n => n.type === format,
    });

    return !!match;
}

function isMarkActive(editor: Editor, format: string) {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
}

function toggleBlock(editor: Editor, format: string) {
    const isActive = isBlockActive(editor, format);
    const isList = LIST_TYPES.includes(format);

    Transforms.unwrapNodes(editor, {
        match: n => LIST_TYPES.includes(n.type as string),
        split: true,
    });

    Transforms.setNodes(editor, {
        type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    });

    if (!isActive && isList) {
        const block = { type: format, children: [] };
        Transforms.wrapNodes(editor, block);
    }
}

function toggleMark(editor: Editor, format: string) {
    const isActive = isMarkActive(editor, format)

    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
}

export function Element({ attributes, children, element }: RenderElementProps) {
    switch (element.type) {
        case 'block-quote':
            return <blockquote {...attributes}>{children}</blockquote>
        case 'bulleted-list':
            return <ul {...attributes}>{children}</ul>
        case 'heading-one':
            return <h1 {...attributes}>{children}</h1>
        case 'heading-two':
            return <h2 {...attributes}>{children}</h2>
        case 'list-item':
            return <li {...attributes}>{children}</li>
        case 'numbered-list':
            return <ol {...attributes}>{children}</ol>
        default:
            return <p {...attributes}>{children}</p>
    }
}

export function Leaf({ attributes, children, leaf }: RenderLeafProps) {
    if (leaf.bold) {
        children = <strong>{children}</strong>
    }

    if (leaf.code) {
        children = <code>{children}</code>
    }

    if (leaf.italic) {
        children = <em>{children}</em>
    }

    if (leaf.underline) {
        children = <u>{children}</u>
    }

    return <span {...attributes}>{children}</span>
}

export function BlockButton({ format, children }: {
    format: string;
    children?: React.ReactNode;
}) {
    const editor = useSlate();
    return (
        <Button
            variant="outline-secondary"
            active={isBlockActive(editor, format)}
            onMouseDown={event => {
                event.preventDefault();
                toggleBlock(editor, format);
            }}
        >
            {children}
        </Button>
    );
}

export function MarkButton({ format, children }: {
    format: string;
    children?: React.ReactNode;
}) {
    const editor = useSlate();
    return (
        <Button
            variant="outline-secondary"
            active={isMarkActive(editor, format)}
            onMouseDown={event => {
                event.preventDefault();
                toggleMark(editor, format);
            }}
        >
            {children}
        </Button>
    );
}

export function Toolbar() {
    return <div>
        <MarkButton format="bold">
            <TypeBold />
        </MarkButton>
        &nbsp;
        <MarkButton format="italic">
            <TypeItalic />
        </MarkButton>
        &nbsp;
        <MarkButton format="underline">
            <TypeUnderline />
        </MarkButton>
        &nbsp;
        <MarkButton format="code">
            <Code />
        </MarkButton>
        &nbsp;
        &nbsp;
        &nbsp;
        <BlockButton format="heading-one">
            <TypeH1 />
        </BlockButton>
        &nbsp;
        <BlockButton format="heading-two">
            <TypeH2 />
        </BlockButton>
        &nbsp;
        <BlockButton format="heading-three">
            <TypeH3 />
        </BlockButton>
        &nbsp;
        <BlockButton format="block-quote">
            <BlockquoteLeft />
        </BlockButton>
        &nbsp;
        <BlockButton format="numbered-list">
            <ListOl />
        </BlockButton>
        &nbsp;
        <BlockButton format="bulleted-list">
            <ListUl />
        </BlockButton>
    </div>
}

const HOTKEYS = {
    'mod+b': 'bold',
    'mod+i': 'italic',
    'mod+u': 'underline',
    'mod+`': 'code',
}

export function onHotkeyDown(editor: Editor) {
    return (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.ctrlKey && event.key === "b") {
            toggleMark(editor, "bold");
            event.preventDefault();
        } else if (event.ctrlKey && event.key === "i") {
            toggleMark(editor, "italic");
            event.preventDefault();
        } else if (event.ctrlKey && event.key === "u") {
            toggleMark(editor, "underline");
            event.preventDefault();
        } else if (event.ctrlKey && event.key === "`") {
            toggleMark(editor, "code");
            event.preventDefault();
        }
    };
}
