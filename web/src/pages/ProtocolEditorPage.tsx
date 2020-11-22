import React, { useState } from 'react';
import { Button, Dropdown, Form, InputGroup, Spinner } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { ProtocolBlockEditor } from '../components/ProtocolBlockEditor';
import { BlockDefinition } from '../models/block-definition';
import { Protocol, SectionDefinition } from '../models/protocol';
import { auth0State } from '../state/atoms';
import { protocolQuery, upsertProtocol, upsertRun } from '../state/selectors';
import * as uuid from 'uuid';
import { DragSourceMonitor, DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd';
import { CheckCircle, Share } from 'react-bootstrap-icons';
import moment from 'moment';
import { deserializeSlate, serializeSlate } from '../slate';
import { Block } from '../models/block';
import { SharingModal } from '../components/SharingModal';
import { Run, Section } from '../models/run';
import { Element, Leaf, onHotkeyDown, Toolbar } from '../components/Slate';

const initialSlateValue: Node[] = [
    {
        type: 'paragraph',
        children: [
            { text: '' }
        ],
    }
];

interface DragItem {
    type: 'protocol-block' | 'protocol-section';
    index: number;
}
interface DragResult {
    isDragging: boolean;
}

export function ProtocolDraggableBlock({ disabled, index, block, setBlock, moveBlock, deleteBlock }: {
    disabled?: boolean;
    index: number;
    block?: BlockDefinition;
    setBlock: (block?: BlockDefinition) => void;
    moveBlock: (dragIndex: number, hoverIndex: number) => void;
    deleteBlock: (blockId?: string) => void;
}) {
    const ref = React.useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
        accept: 'protocol-block',
        hover(item: DragItem, monitor: DropTargetMonitor) {
            if (!ref.current || item.index === index) {
                return;
            }

            const hoverBoundingRect = ref.current.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset()
            const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

            if (item.index < index && hoverClientY < hoverMiddleY) {
                // Dragging downwards
                return
            }
            if (item.index > index && hoverClientY > hoverMiddleY) {
                // Dragging upwards
                return
            }

            // Time to actually perform the action
            moveBlock(item.index, index)
            item.index = index
        },
    });

    const [{ isDragging }, drag] = useDrag<DragItem, unknown, DragResult>({
        item: { type: 'protocol-block', index },
        collect: (monitor: DragSourceMonitor) => ({ isDragging: monitor.isDragging() }),
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));
    return (
        <div ref={ref} style={{ opacity }} className="mt-5 mb-5">
            <ProtocolBlockEditor disabled={disabled} index={index} block={block} setBlock={setBlock} deleteBlock={() => deleteBlock(block && block.id)} />
        </div>
    );
}

export function ProtocolDraggableSection({ disabled, index, section, setSection, moveSection, deleteSection }: {
    disabled?: boolean;
    index: number;
    section?: SectionDefinition;
    setSection: (section?: SectionDefinition) => void;
    moveSection: (dragIndex: number, hoverIndex: number) => void;
    deleteSection: (sectionId?: string) => void;
}) {
    const ref = React.useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
        accept: 'protocol-section',
        hover(item: DragItem, monitor: DropTargetMonitor) {
            if (!ref.current || item.index === index) {
                return;
            }

            const hoverBoundingRect = ref.current.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset()
            const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

            if (item.index < index && hoverClientY < hoverMiddleY) {
                // Dragging downwards
                return
            }
            if (item.index > index && hoverClientY > hoverMiddleY) {
                // Dragging upwards
                return
            }

            // Time to actually perform the action
            moveSection(item.index, index)
            item.index = index
        },
    });

    const [{ isDragging }, drag] = useDrag<DragItem, unknown, DragResult>({
        item: { type: 'protocol-section', index },
        collect: (monitor: DragSourceMonitor) => ({ isDragging: monitor.isDragging() }),
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));
    return (
        <div ref={ref} style={{ opacity }} className="mt-5 mb-5">
            <ProtocolSectionEditor disabled={disabled} index={index} section={section} setSection={setSection} deleteSection={() => deleteSection(section && section.id)} />
        </div>
    );
}

export function ProtocolSectionEditor({disabled, index, section, setSection}: {
    disabled?: boolean;
    index: number;
    section?: SectionDefinition;
    setSection: (section?: SectionDefinition) => void;
    deleteSection: (sectionId?: string) => void;
}) {
    const currentBlocks = React.useMemo(() => (section && section.blocks) || [], [section]);

    const addBlock = (block?: BlockDefinition) => {
        if (block) {
            setSection({
                ...section,
                blocks: [...currentBlocks, block],
            });
        }
    }
    const updateBlock = (block?: BlockDefinition) => {
        if (block) {
            setSection({
                ...section,
                blocks: currentBlocks.map(b => (b.id === block.id) ? block : b)
            });
        }
    };
    const moveBlock = React.useCallback(
        (dragIndex: number, hoverIndex: number) => {
            const dragBlock = currentBlocks[dragIndex]
            const newBlocks = [...currentBlocks];
            newBlocks.splice(dragIndex, 1);
            newBlocks.splice(hoverIndex, 0, dragBlock);
            setSection({
                ...section,
                blocks: newBlocks
            });
        },
        [currentBlocks, section, setSection],
    )
    const deleteBlock = (blockId?: string) => {
        if (blockId) {
            setSection({
                ...section,
                blocks: currentBlocks.filter(b => b.id !== blockId)
            });
        }
    }

    const updateSectionTitle = (sectionTitle?: string) => {
      setSection({
        ...section,
        name: sectionTitle
      });
    }

    return <>
        <Form.Group>
          <h3 className="row"><Form.Label>Protocol section:</Form.Label></h3>
          <Form.Control
            disabled={disabled}
            type="text"
            placeholder="Enter the title. A section has a signature block during a run."
            value={(section && section.name)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSectionTitle((e.target as HTMLInputElement).value)}
          />
        </Form.Group>

        {currentBlocks.map((block, index) => {
            if (!block || !block.id) {
                return undefined;
            }
            return <ProtocolDraggableBlock
                key={block.id}
                index={index}
                moveBlock={moveBlock}
                block={block}
                setBlock={updateBlock}
                deleteBlock={deleteBlock}
                disabled={disabled}
            />;
        })}
        

        {
            !disabled && <div className="row">
                <Dropdown className="col-auto my-3 mx-auto">
                    <Dropdown.Toggle variant="success" id="block-add">
                        Add a new block
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'text-question' })}>Text Question</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'options-question' })}>Options Question</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'plate-sampler' })}>Run Plate Sampler</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'plate-add-reagent' })}>Add Reagent to Plate</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'start-thermocycler' })}>Start Thermocycler</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'end-thermocycler' })}>End Thermocycler</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'plate-sequencer' })}>Run Plate Sequencer</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        }
    </>
}

export interface ProtocolEditorPageParams {
    id: string;
}

export function ProtocolEditorPage() {
    const history = useHistory();
    const [protocolTimestamp, setProtocolTimestamp] = useState("");
    const [showSharingModal, setShowSharingModal] = useState(false);
    const [name, setName] = useState<string | null>(null);
    const [description, setDescription] = useState<Node[] | null>(null);
    const [sections, setSections] = useState<SectionDefinition[] | null>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [witness, setWitness] = useState<string | null>(null);
    const [formSaving, setFormSaving] = useState<boolean>(false);
    const [formSavedTime, setFormSavedTime] = useState<string | null>(null);
    const editor = React.useMemo(() => withReact(createEditor()), []);
    const { id } = useParams<ProtocolEditorPageParams>();
    const protocol = useRecoilValue(protocolQuery({ protocolId: parseInt(id), queryTime: protocolTimestamp }));
    const protocolUpsert = useRecoilCallback(({ snapshot }) => async (protocol: Protocol) => {
        setFormSaving(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await upsertProtocol(() => auth0Client, protocol);
        } finally {
            setFormSaving(false);
            setFormSavedTime(moment().format());
            setProtocolTimestamp(moment().format());
            // setName(null);
            // setDescription(null);
            // setBlocks(null);
        }
    });
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        return await upsertRun(() => auth0Client, run);
    });

    const currentName = React.useMemo(() => ((name !== null) ? name : (protocol && protocol.name)) || '', [name, protocol]);
    const currentDescription = React.useMemo(() => ((description !== null) ? description : (protocol && protocol.description && deserializeSlate(protocol.description))) || initialSlateValue, [description, protocol]);
    const currentSections = React.useMemo(() => ((sections !== null) ? sections : (protocol && protocol.sections)) || [], [sections, protocol]);
    const currentSignature = React.useMemo(() => ((signature !== null) ? signature : (protocol && protocol.signature)) || '', [signature, protocol]);
    const currentWitness = React.useMemo(() => ((witness !== null) ? witness : (protocol && protocol.witness)) || '', [witness, protocol]);

    const addSection = (section?: SectionDefinition) => {
        if (section) {
            setSections([...currentSections, section]);
        }
    }
    const updateSection = (section?: SectionDefinition) => {
        if (section) {
            setSections(currentSections.map(b => (b.id === section.id) ? section : b));
        }
    };
    const moveSection = React.useCallback(
        (dragIndex: number, hoverIndex: number) => {
            const dragSection = currentSections[dragIndex]
            const newSections = [...currentSections];
            newSections.splice(dragIndex, 1);
            newSections.splice(hoverIndex, 0, dragSection);
            setSections(newSections);
        },
        [currentSections],
    )
    const deleteSection = (sectionId?: string) => {
        if (sectionId) {
            setSections(currentSections.filter(b => b.id !== sectionId));
        }
    }

    const isSigned = (protocol && !!protocol.signedOn) || false;
    const isWitnessed = (protocol && !!protocol.witnessedOn) || false;

    // Slate helpers.
    const renderElement = React.useCallback(props => <Element {...props} />, []);
    const renderLeaf = React.useCallback(props => <Leaf {...props} />, []);

    const syncProtocol = (override?: Protocol) => {
        const newProtocol: Protocol = Object.assign({
            id: parseInt(id),
            name: currentName,
            description: serializeSlate(currentDescription),
            sections: currentSections,
            signature: currentSignature,
            witness: currentWitness,
        }, override);
        if (protocol && protocol.signedOn) {
            newProtocol.signedOn = protocol.signedOn;
        }
        if (protocol && protocol.witnessedOn) {
            newProtocol.witnessedOn = protocol.witnessedOn;
        }
        protocolUpsert(newProtocol);
    }

    return <>
        <SharingModal
            show={showSharingModal}
            setShow={show => setShowSharingModal(show || false)}
            targetName="Protocol"
            targetPath={`/protocol/${id}`}
        />
        <Form className="mt-4">
            <Form.Group>
                <Form.Label><h2 className="row">Protocol Title</h2></Form.Label>
                <InputGroup>
                    <Form.Control
                        type="text"
                        value={currentName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
                        disabled={isSigned || isWitnessed}
                    />
                    <InputGroup.Append>
                        <Button variant="secondary" onClick={() => setShowSharingModal(true)}>
                            <Share /> Share
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>
            <Form.Group>
                <Form.Label>Description</Form.Label>
                <Slate
                    editor={editor}
                    value={currentDescription}
                    onChange={setDescription}
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

            {currentSections.map((section, index) => {
                if (!section || !section.id) {
                    return undefined;
                }
                return <ProtocolDraggableSection
                    key={section.id}
                    index={index}
                    moveSection={moveSection}
                    section={section}
                    setSection={updateSection}
                    deleteSection={deleteSection}
                    disabled={isSigned || isWitnessed}
                />;
            })}

            {
                !isSigned && !isWitnessed && <div className="row">
                    <Button className="col-auto my-3 mx-auto" onClick={() => addSection({ id: uuid.v4() })}>Add a new section</Button>
                </div>
            }

            <div className="row">
                <Form.Group className="col-3 ml-auto">
                    <Form.Label>Protocol Signature</Form.Label>
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
                                const override: Protocol = {};
                                if (isSigned) {
                                    override.signature = "";
                                    override.witness = "";
                                }
                                syncProtocol(override);
                            }}>
                                {(isSigned || isWitnessed) ? 'Un-sign' : 'Sign'}
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </div>

            {
                protocol && protocol.signedOn && <div className="row">
                    <div className="col-3 ml-auto">
                        Signed On: {moment(protocol && protocol.signedOn).format('LLLL')}
                    </div>
                </div>
            }

            <div className="row">
                <Form.Group className="col-3 ml-auto">
                    <Form.Label>Protocol Witness</Form.Label>
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
                                const override: Protocol = {};
                                if (isWitnessed) {
                                    override.witness = "";
                                }
                                syncProtocol(override);
                            }}>
                                {isWitnessed ? 'Un-sign' : 'Sign'}
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </div>

            {
                protocol && protocol.witnessedOn && <div className="row">
                    <div className="col-3 ml-auto">
                        Witnessed On: {moment(protocol && protocol.witnessedOn).format('LLLL')}
                    </div>
                </div>
            }

            <div className="row">
                <Button
                    className="col-auto"
                    variant="success"
                    onClick={async () => {
                        if (!protocol) {
                            return;
                        }
                        // Create new run
                        const created = await runUpsert({
                            status: 'todo',
                            sections: protocol.sections && protocol.sections.map(section => ({
                                definition: section,
                                blocks: section.blocks && section.blocks.map(definition => ({
                                    type: definition.type,
                                    definition,
                                } as Block)),
                            } as Section)),
                            protocol,
                        });
                        // Redirect to the new run page editor
                        history.push(`/run/${created.id}`);
                    }}
                >
                    Create Run
                </Button>
                <Button
                    className="col-auto ml-3"
                    variant="primary"
                    onClick={() => syncProtocol()}
                    disabled={formSaving}
                >
                    {
                        formSaving
                            ? <><Spinner size="sm" animation="border" /> Saving...</>
                            : <>Save</>
                    }
                </Button>
                <div className="col"></div>
                <div className="col-auto my-auto">
                    {formSavedTime && <><CheckCircle /> Last saved on: {moment(formSavedTime).format('LLLL')}</>}
                </div>
            </div>
        </Form>
    </>;
}
