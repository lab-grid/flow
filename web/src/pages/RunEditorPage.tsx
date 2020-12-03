import React, { useState } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, InputGroup, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { RunBlockEditor } from '../components/RunBlockEditor';
import { calculateRunStatus, humanizeRunName, Run, Section } from '../models/run';
import { auth0State, errorsState } from '../state/atoms';
import { runQuery, upsertRun, userQuery } from '../state/selectors';
import { Block } from '../models/block';
import { deserializeSlate, serializeSlate } from '../slate';
import moment from 'moment';
import { CheckCircle, Share } from 'react-bootstrap-icons';
import { SharingModal } from '../components/SharingModal';
import { Element, Leaf, onHotkeyDown, Toolbar } from '../components/Slate';
import { FetchError } from '../state/api';

const initialSlateValue: Node[] = [
    {
        type: 'paragraph',
        children: [
            { text: '' }
        ],
    }
];

export function RunSectionEditor({disabled, index, section, setSection, syncSection}: {
    disabled?: boolean;
    index: number;
    section?: Section;
    setSection: (section?: Section) => void;
    syncSection: (section?: Section) => void;
}) {
    const [userTimestamp] = useState("");
    const { user: auth0User } = useRecoilValue(auth0State);
    const loggedInUser = useRecoilValue(userQuery({userId: auth0User && auth0User.sub, queryTime: userTimestamp}));

    const currentBlocks = (section && section.blocks) || [];
    const currentSignature = (section && section.signature) || '';
    const currentWitness = (section && section.witness) || '';

    const isSigned = (section && !!section.signedOn) || false;
    const isWitnessed = (section && !!section.witnessedOn) || false;
    
    const updateBlock = (block?: Block) => {
        if (block && section) {
            setSection({
                ...section,
                blocks: currentBlocks.map(b => (b.definition.id === block.definition.id) ? block : b),
            });
        }
    };

    return <>
        <h2 className="row">
            <i>Section: {(section && section.definition.name) || 'Untitled Section'}</i>
        </h2>

        {currentBlocks.map(block => {
            if (!block || !block.definition || !block.definition.id) {
                return undefined;
            }
            return <div key={block.definition.id}>
              <RunBlockEditor
                key={block.definition.id}
                block={block}
                setBlock={updateBlock}
                disabled={isSigned || isWitnessed}
              />
            </div>
        })}

        <div className="row">
            <Form.Group className="col-3 ml-auto">
                <Form.Label>Signature</Form.Label>
                <InputGroup>
                    <Form.Control
                        className="flow-signature"
                        type="text"
                        value={currentSignature}
                        disabled={true}
                    />
                    <InputGroup.Append>
                        <Button variant="secondary" onClick={() => {
                            if (section) {
                                if (isSigned || isWitnessed) {
                                    const { signature, witness, signedOn, witnessedOn, ...newSection} = section;
                                    syncSection(newSection);
                                } else {
                                    if (loggedInUser) {
                                        syncSection({
                                            ...section,
                                            signature: loggedInUser.fullName,
                                            signedOn: moment().format(),
                                        });
                                    }
                                }
                            }
                        }}>
                            {(isSigned || isWitnessed) ? 'Un-sign' : 'Sign'}
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>
        </div>

        {
            section && section.signedOn && <div className="row">
                <div className="col-3 ml-auto">
                    Signed On: {moment(section && section.signedOn).format('LLL')}
                </div>
            </div>
        }

        <div className="row">
            <Form.Group className="col-3 ml-auto">
                <Form.Label>Witness</Form.Label>
                <InputGroup>
                    <Form.Control
                        className="flow-signature"
                        type="text"
                        value={currentWitness}
                        disabled={true}
                    />
                    <InputGroup.Append>
                        <Button variant="secondary" disabled={!isSigned} onClick={() => {
                            if (section) {
                                if (isWitnessed) {
                                    const { witness, witnessedOn, ...newSection} = section;
                                    syncSection(newSection)
                                } else {
                                    if (loggedInUser) {
                                        syncSection({
                                            ...section,
                                            witness: loggedInUser.fullName,
                                            witnessedOn: moment().format(),
                                        });
                                    }
                                }
                            }
                        }}>
                            {isWitnessed ? 'Un-sign' : 'Sign'}
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>
        </div>

        {
            section && section.witnessedOn && <div className="row">
                <div className="col-3 ml-auto">
                    Witnessed On: {moment(section && section.witnessedOn).format('LLL')}
                </div>
            </div>
        }
    </>
}

export interface RunEditorPageParams {
    id: string;
}

export function RunEditorPage() {
    const [runTimestamp, setRunTimestamp] = useState("");
    const [showSharingModal, setShowSharingModal] = useState(false);
    const [notes, setNotes] = useState<Node[] | null>(null);
    const [sections, setSections] = useState<Section[] | null>(null);
    const [formSaving, setFormSaving] = useState<boolean>(false);
    const [formSavedTime, setFormSavedTime] = useState<string | null>(null);
    const editor = React.useMemo(() => withReact(createEditor()), []);
    const { id } = useParams<RunEditorPageParams>();
    const run = useRecoilValue(runQuery({ runId: parseInt(id), queryTime: runTimestamp }));
    const [errors, setErrors] = useRecoilState(errorsState);
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        setFormSaving(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await upsertRun(() => auth0Client, run);
        } catch (e) {
            if (e instanceof FetchError) {
                const err: FetchError = e;
                setErrors({
                    ...errors,
                    errors: [...(errors.errors || []), err],
                });
            }
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
    const currentSections = ((sections !== null) ? sections : (run && run.sections)) || [];

    const updateSection = (section?: Section) => {
        if (section) {
            setSections(currentSections.map(b => (b.definition.id === section.definition.id) ? section : b));
        }
    };

    const isCompleted = (run && run.status) === 'completed';

    // Slate helpers.
    const renderElement = React.useCallback(props => <Element {...props} />, []);
    const renderLeaf = React.useCallback(props => <Leaf {...props} />, []);

    const syncRun = (override?: Run) => {
        const run: Run = Object.assign({
            id: parseInt(id),
            notes: serializeSlate(currentNotes),
            sections: currentSections,
        }, override);
        run.status = calculateRunStatus(run);
        runUpsert(run);
    };
    const syncSection = (index: number) => (override?: Section) => {
        if (override) {
            syncRun({
                sections: currentSections.map((s, i) => i === index ? override : s),
            })
        } else {
            syncRun();
        }
    }

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
            <br></br>
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
                        placeholder="Enter run notes here..."
                        onKeyDown={onHotkeyDown(editor)}
                        spellCheck
                        disabled={isCompleted}
                    />
                </Slate>
            </Form.Group>
            {currentSections.map((section, i) => {
                if (!section || !section.definition || !section.definition.id) {
                    return undefined;
                }
                return <RunSectionEditor
                    key={section.definition.id}
                    index={i}
                    section={section}
                    setSection={updateSection}
                    syncSection={syncSection(i)}
                />
            })}

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
