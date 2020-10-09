import React from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValueLoadable } from 'recoil';
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { LoadableError } from '../components/LoadableError';
import { RunBlockEditor } from '../components/RunBlockEditor';
import { labflowOptions } from '../config';
import { Run } from '../models/run';
import { apiFetch } from '../state/api';
import { auth0State, runsState } from '../state/atoms';
import { runQuery } from '../state/selectors';

// Define a serializing function that takes a value and returns a string.
export function serializeSlate(value: Node[]): string{
    return (
        value
            // Return the string content of each paragraph in the value's children.
            .map(n => Node.string(n))
            // Join them all with line breaks denoting paragraphs.
            .join('\n')
    )
}

// Define a deserializing function that takes a string and returns a value.
export function deserializeSlate(str: string): Node[] {
    // Return a value array of children derived by splitting the string.
    return str.split('\n').map(line => {
        return {
            children: [{ text: line }],
        }
    })
}

export interface RunEditorPageParams {
    id: string;
}

export function RunEditorPage() {
    const editor = React.useMemo(() => withReact(createEditor()), []);

    const { id } = useParams<RunEditorPageParams>();

    const runLoadable = useRecoilValueLoadable(runQuery(parseInt(id)));
    const runUpsert = useRecoilCallback(({ set, snapshot }) => async (run: Run) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        if (run.id) {
            const response = await apiFetch(labflowOptions, () => auth0Client, "PUT", `/run/${run.id}`, run);
            set(runsState, await response.json());
        } else {
            const response = await apiFetch(labflowOptions, () => auth0Client, "POST", `/run`, run);
            set(runsState, await response.json());
        }
    });

    switch (runLoadable.state) {
        case "hasValue":
            return (
                <Form>
                    <Form.Group controlId="formRunTitle">
                        <Form.Label>Run Title</Form.Label>
                        <Form.Control type="text" />
                    </Form.Group>
                    <Slate
                        editor={editor}
                        value={(runLoadable.contents && runLoadable.contents.description) ? deserializeSlate(runLoadable.contents.description) : []}
                        onChange={newValue => runUpsert({ ...runLoadable.contents, description: serializeSlate(newValue) })}
                    >
                        <Editable />
                    </Slate>

                    {
                        runLoadable.contents &&
                        runLoadable.contents.blocks &&
                        runLoadable.contents.blocks.map(block => <RunBlockEditor
                            block={block}
                            setBlock={block => {
                                if (runLoadable.contents && block) {
                                    const blocks = (runLoadable.contents.blocks || []).map(b => (b.id === block.id) ? block : b);
                                    runUpsert({ ...runLoadable.contents, blocks });
                                }
                            }}
                        />)
                    }
                </Form>
            );
        case "hasError":
            return (
                <LoadableError error={runLoadable.contents} />
            );
        case "loading":
            return (
                <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                />
            );
    }
}
