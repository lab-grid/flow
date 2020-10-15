import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
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
import { Block } from '../models/block';

// Define a serializing function that takes a value and returns a string.
export function serializeSlate(value: Node[]): string {
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
    const [name, setName] = useState<string | null>(null);
    const [description, setDescription] = useState<Node[] | null>(null);
    const [blocks, setBlocks] = useState<Block[] | null>(null);
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

    const currentName = name || (run && run.name) || "";
    const currentDescription = description || (run && run.description && deserializeSlate(run.description)) || [];
    const currentBlocks = blocks || (run && run.blocks) || [];

    const updateBlock = (block?: Block) => {
        if (block) {
            setBlocks(currentBlocks.map(b => (b.definition.id === block.definition.id) ? block : b));
        }
    };

    return (
        <Form>
            <Form.Group controlId="formRunTitle">
                <Form.Label>Run Title</Form.Label>
                <Form.Control
                    type="text"
                    value={currentName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
                />
            </Form.Group>
            <Slate
                editor={editor}
                value={currentDescription}
                onChange={setDescription}
            >
                <Editable />
            </Slate>
            {currentBlocks.map((block, index) => {
                if (!block || !block.definition || !block.definition.id) {
                    return undefined;
                }
                return <RunBlockEditor key={block.definition.id} block={block} setBlock={updateBlock} />
            })}

            <div className="row">
                <Button
                    className="col-auto mr-3"
                    variant="primary"
                    disabled={true}>Sign</Button>
                <Button
                    className="col-auto mr-3"
                    variant="primary"
                    disabled={true}>Witness</Button>
                <Button
                    className="col-auto"
                    variant="primary"
                    onClick={() => runUpsert({
                        id: parseInt(id),
                        name: currentName,
                        description: serializeSlate(currentDescription),
                        blocks: currentBlocks,
                    })}
                >
                    Save
                </Button>
            </div>
        </Form>
    );
}
