import React from 'react';
import { Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
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

    const run = useRecoilValue(runQuery(parseInt(id)));
    const runUpsert = useRecoilCallback(({ set, snapshot }) => async (run: Run) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        const method = run.id ? "PUT" : "POST";
        const path = run.id ? `run/${run.id}` : "run";
        const created: Run = await apiFetch(labflowOptions, () => auth0Client, method, path, run);
        set(runsState, state => {
            if (created.id) {
                state.runCache.set(created.id, created);
                return state;
            } else {
                throw new Error("Received a run without an ID from server!");
            }
        });
    });

    return (
        <Form>
            <Form.Group controlId="formRunTitle">
                <Form.Label>Run Title</Form.Label>
                <Form.Control type="text" />
            </Form.Group>
            <Slate
                editor={editor}
                value={(run && run.description) ? deserializeSlate(run.description) : []}
                onChange={newValue => runUpsert({ ...run, description: serializeSlate(newValue) })}
            >
                <Editable />
            </Slate>

            {
                run &&
                run.blocks &&
                run.blocks.map(block => <RunBlockEditor
                    block={block}
                    setBlock={block => {
                        if (run && block) {
                            const blocks = (run.blocks || []).map(b => (b.id === block.id) ? block : b);
                            runUpsert({ ...run, blocks });
                        }
                    }}
                />)
            }
        </Form>
    );
}
