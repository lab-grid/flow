import React, { useState } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, InputGroup, Spinner } from 'react-bootstrap';
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
    const [signature, setSignature] = useState<string | null>(null);
    const [witness, setWitness] = useState<string | null>(null);
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

    const currentNotes = ((notes !== null) ? notes : (run && run.notes && deserializeSlate(run.notes))) || initialSlateValue;
    const currentBlocks = ((blocks !== null) ? blocks : (run && run.blocks)) || [];
    const currentStatus = ((status !== null) ? status : (run && run.status)) || 'todo';
    const currentSignature = ((signature !== null) ? signature : (run && run.signature)) || '';
    const currentWitness = ((witness !== null) ? witness : (run && run.witness)) || '';

    const updateBlock = (block?: Block) => {
        if (block) {
            setBlocks(currentBlocks.map(b => (b.definition.id === block.definition.id) ? block : b));
        }
    };

    const isSigned = currentStatus === 'signed';
    const isWitnessed = currentStatus === 'witnessed';

    // Slate helpers.
    const renderElement = React.useCallback(props => <Element {...props} />, []);
    const renderLeaf = React.useCallback(props => <Leaf {...props} />, []);

    const syncRun = () => runUpsert({
        id: parseInt(id),
        notes: serializeSlate(currentNotes),
        status: currentStatus,
        blocks: currentBlocks,
        signature: currentSignature,
        witness: currentWitness,
    });

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
                        disabled={isSigned || isWitnessed}
                    />
                </Slate>
            </Form.Group>
            {currentBlocks.map(block => {
                if (!block || !block.definition || !block.definition.id) {
                    return undefined;
                }
                return <RunBlockEditor
                    key={block.definition.id}
                    block={block}
                    setBlock={updateBlock}
                    disabled={isSigned || isWitnessed}
                />
            })}

            <div className="row">
                <Form.Group className="col-3 ml-auto">
                    <Form.Label>Signature</Form.Label>
                    <InputGroup>
                        <Form.Control
                            className="flow-signature"
                            type="text"
                            value={currentSignature}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSignature((e.target as HTMLInputElement).value)}
                            disabled={isSigned}
                        />
                        <InputGroup.Append>
                            <Button variant="secondary" onClick={() => {
                                setStatus(isSigned ? 'todo' : 'signed');
                                setSignature("");
                                setWitness("");
                                syncRun();
                            }}>
                                {(isSigned || isWitnessed) ? 'Un-sign' : 'Sign'}
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </div>

            <div className="row">
                <Form.Group className="col-3 ml-auto">
                    <Form.Label>Witness</Form.Label>
                    <InputGroup>
                        <Form.Control
                            className="flow-signature"
                            type="text"
                            value={currentWitness}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWitness((e.target as HTMLInputElement).value)}
                            disabled={isWitnessed || !isSigned}
                        />
                        <InputGroup.Append>
                            <Button variant="secondary" disabled={!isSigned} onClick={() => {
                                setWitness(isWitnessed ? 'signed' : 'witnessed');
                                setWitness("");
                                syncRun();
                            }}>
                                {isWitnessed ? 'Un-sign' : 'Sign'}
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </div>

            <div className="row">
                <ButtonToolbar className="col-auto">
                    <ButtonGroup>
                        <Button
                            className="col-auto"
                            variant="primary"
                            onClick={() => syncRun()}
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
