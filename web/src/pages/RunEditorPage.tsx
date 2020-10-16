import React, { useState } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form } from 'react-bootstrap';
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
import { deserializeSlate, serializeSlate } from '../slate';

export interface RunEditorPageParams {
    id: string;
}

export function RunEditorPage() {
    const [name, setName] = useState<string | null>(null);
    const [description, setDescription] = useState<Node[] | null>(null);
    const [blocks, setBlocks] = useState<Block[] | null>(null);
    const [status, setStatus] = useState<"todo" | "signed" | "witnessed" | null>(null);
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
    const currentStatus = status || (run && run.status) || 'todo';

    const updateBlock = (block?: Block) => {
        if (block) {
            setBlocks(currentBlocks.map(b => (b.definition.id === block.definition.id) ? block : b));
        }
    };

    const isSigned = currentStatus === 'signed';
    const isWitnessed = currentStatus === 'witnessed';
    const isTodo = currentStatus === 'todo';

    return (
        <Form className="mt-4">
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

            <ButtonToolbar>
                <ButtonGroup className="mr-2">
                    <Button
                        variant={isTodo ? 'success' : 'secondary'}
                        onClick={() => setStatus('todo')}
                    >
                        {isTodo ? 'To Do' : 'Done'}
                    </Button>
                    <Button
                        variant={isSigned ? 'success' : 'secondary'}
                        onClick={() => setStatus('signed')}
                        disabled={isSigned}
                    >
                        {(isSigned || isWitnessed) ? 'Signed' : 'Sign'}
                    </Button>
                    <Button
                        variant={isWitnessed ? 'success' : 'secondary'}
                        onClick={() => setStatus('witnessed')}
                        disabled={isWitnessed || !isSigned}
                    >
                        {isWitnessed ? 'Witnessed' : 'Witness'}
                    </Button>
                </ButtonGroup>
                <ButtonGroup>
                    <Button
                        className="col-auto"
                        variant="primary"
                        onClick={() => runUpsert({
                            id: parseInt(id),
                            name: currentName,
                            description: serializeSlate(currentDescription),
                            status: currentStatus,
                            blocks: currentBlocks,
                        })}
                    >
                        Save
                    </Button>
                </ButtonGroup>
            </ButtonToolbar>
        </Form>
    );
}
