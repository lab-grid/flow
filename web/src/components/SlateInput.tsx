import React from "react";
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { Element, Leaf, onHotkeyDown, Toolbar } from './Slate';

export function SlateInput({className, placeholder, disabled, value, onChange}: {
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    value: Node[];
    onChange: (description: Node[] | null) => void;
}) {
    const editor = React.useMemo(() => withReact(createEditor()), []);
    const renderElement = React.useCallback(props => <Element {...props} />, []);
    const renderLeaf = React.useCallback(props => <Leaf {...props} />, []);

    return (
        <Slate
            className={className}
            editor={editor}
            value={value}
            onChange={onChange}
        >
            <Toolbar className="mb-1" />
            <Editable
                className="form-control"
                style={{
                    minHeight: "100px",
                }}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder={placeholder}
                onKeyDown={onHotkeyDown(editor)}
                spellCheck
                disabled={disabled}
            />
        </Slate>
    );
}
