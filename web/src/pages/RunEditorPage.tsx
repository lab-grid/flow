import React, { useState } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { RunBlockEditor } from '../components/RunBlockEditor';
import { humanizeRunName, Run } from '../models/run';
import { auth0State } from '../state/atoms';
import { runQuery, upsertRun } from '../state/selectors';
import { Block } from '../models/block';
import { deserializeSlate, serializeSlate } from '../slate';
import moment from 'moment';
import { CheckCircle, Share } from 'react-bootstrap-icons';
import { SharingModal } from '../components/SharingModal';
import { Element, Leaf, onHotkeyDown, Toolbar } from '../components/Slate';

const initialSlateValue: Node[] = [
    {
        type: 'paragraph',
        children: [
            { text: '' }
        ],
    }
];

export interface RunEditorPageParams {
    id: string;
}

export function RunEditorPage() {
    const [runTimestamp, setRunTimestamp] = useState(moment().format());
    const [showSharingModal, setShowSharingModal] = useState(false);
    const [notes, setNotes] = useState<Node[] | null>(null);
    const [blocks, setBlocks] = useState<Block[] | null>(null);
    const [status, setStatus] = useState<"todo" | "signed" | "witnessed" | null>(null);
    const [formSaving, setFormSaving] = useState<boolean>(false);
    const [formSavedTime, setFormSavedTime] = useState<string | null>(null);
    const editor = React.useMemo(() => withReact(createEditor()), []);
    const { id } = useParams<RunEditorPageParams>();
    const run = useRecoilValue(runQuery({ runId: parseInt(id), queryTime: runTimestamp }));
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        setFormSaving(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await upsertRun(() => auth0Client, run);
        } finally {
            setFormSaving(false);
            setFormSavedTime(moment().format());
            setRunTimestamp(moment().format());
            // setNotes(null);
            // setBlocks(null);
            // setStatus(null);
        }
    });

    const currentNotes = notes || (run && run.notes && deserializeSlate(run.notes)) || initialSlateValue;
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

    // Slate helpers.
    const renderElement = React.useCallback(props => <Element {...props} />, []);
    const renderLeaf = React.useCallback(props => <Leaf {...props} />, []);

    return <>
        <SharingModal
            show={showSharingModal}
            setShow={show => setShowSharingModal(show || false)}
            targetName="Run"
            targetPath={`/run/${id}`}
        />
        <Form className="mt-4 container">
            <div className="row">
                <h1 className="col">{humanizeRunName(run)}</h1>
                <Button className="col-auto ml-3 my-auto" variant="secondary" onClick={() => setShowSharingModal(true)}>
                    <Share /> Share
                </Button>
            </div>
            <Form.Group>
                <Form.Label>Notes</Form.Label>
                <Slate
                    editor={editor}
                    value={currentNotes}
                    onChange={setNotes}
                >
                    <Toolbar />
                    <Editable
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        placeholder="Enter a description here..."
                        onKeyDown={onHotkeyDown(editor)}
                        spellCheck
                    />
                </Slate>
            </Form.Group>
            {currentBlocks.map(block => {
                if (!block || !block.definition || !block.definition.id) {
                    return undefined;
                }
                return <RunBlockEditor key={block.definition.id} block={block} setBlock={updateBlock} />
            })}

            <div className="row">
                <ButtonToolbar className="col-auto">
                    <ButtonGroup className="mr-2">
                        <Button
                            variant={isTodo ? 'success' : 'secondary'}
                            onClick={() => setStatus('todo')}
                            disabled={formSaving}
                        >
                            {isTodo ? 'To Do' : 'Done'}
                        </Button>
                        <Button
                            variant={isSigned ? 'success' : 'secondary'}
                            onClick={() => setStatus('signed')}
                            disabled={isSigned || formSaving}
                        >
                            {(isSigned || isWitnessed) ? 'Signed' : 'Sign'}
                        </Button>
                        <Button
                            variant={isWitnessed ? 'success' : 'secondary'}
                            onClick={() => setStatus('witnessed')}
                            disabled={isWitnessed || !isSigned || formSaving}
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
                                notes: serializeSlate(currentNotes),
                                status: currentStatus,
                                blocks: currentBlocks,
                            })}
                            disabled={formSaving}
                        >
                            {
                                formSaving
                                    ? <><Spinner size="sm" animation="border" /> Saving...</>
                                    : <>Save</>
                            }
                        </Button>
                    </ButtonGroup>
                </ButtonToolbar>
                <div className="col"></div>
                <div className="col-auto my-auto">
                    {formSavedTime && <><CheckCircle /> Last saved on: {moment(formSavedTime).format('LLLL')}</>}
                </div>
            </div>
        </Form>
    </>;
}
