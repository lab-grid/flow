import React, { useState } from 'react';
import { Button, Dropdown, Form, InputGroup, Spinner } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { ProtocolBlockEditor } from '../components/ProtocolBlockEditor';
import { BlockDefinition } from '../models/block-definition';
import { Protocol } from '../models/protocol';
import { auth0State } from '../state/atoms';
import { protocolQuery, upsertProtocol, upsertRun } from '../state/selectors';
import * as uuid from 'uuid';
import { DragSourceMonitor, DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd';
import { CheckCircle, Share } from 'react-bootstrap-icons';
import moment from 'moment';
import { deserializeSlate, serializeSlate } from '../slate';
import { Block } from '../models/block';
import { SharingModal } from '../components/SharingModal';
import { Run } from '../models/run';
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
    type: 'protocol-block';
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

export interface ProtocolEditorPageParams {
    id: string;
}

export function ProtocolEditorPage() {
    const history = useHistory();
    const [protocolTimestamp, setProtocolTimestamp] = useState(moment().format());
    const [showSharingModal, setShowSharingModal] = useState(false);
    const [name, setName] = useState<string | null>(null);
    const [description, setDescription] = useState<Node[] | null>(null);
    const [blocks, setBlocks] = useState<BlockDefinition[] | null>(null);
    const [status, setStatus] = useState<"todo" | "signed" | "witnessed" | null>(null);
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

    const currentName = ((name !== null) ? name : (protocol && protocol.name)) || '';
    const currentDescription = ((description !== null) ? description : (protocol && protocol.description && deserializeSlate(protocol.description))) || initialSlateValue;
    const currentBlocks = ((blocks !== null) ? blocks : (protocol && protocol.blocks)) || [];
    const currentStatus = ((status !== null) ? status : (protocol && protocol.status)) || 'todo';
    const currentSignature = ((signature !== null) ? signature : (protocol && protocol.signature)) || '';
    const currentWitness = ((witness !== null) ? witness : (protocol && protocol.witness)) || '';

    const updateBlock = (block?: BlockDefinition) => {
        if (block) {
            setBlocks(currentBlocks.map(b => (b.id === block.id) ? block : b));
        }
    };
    const moveBlock = React.useCallback(
        (dragIndex: number, hoverIndex: number) => {
            const dragBlock = currentBlocks[dragIndex]
            const newBlocks = [...currentBlocks];
            newBlocks.splice(dragIndex, 1);
            newBlocks.splice(hoverIndex, 0, dragBlock);
            setBlocks(newBlocks);
        },
        [currentBlocks],
    )
    const deleteBlock = (blockId?: string) => {
        if (blockId) {
            setBlocks(currentBlocks.filter(b => b.id !== blockId));
        }
    }

    const isSigned = currentStatus === 'signed';
    const isWitnessed = currentStatus === 'witnessed';

    // Slate helpers.
    const renderElement = React.useCallback(props => <Element {...props} />, []);
    const renderLeaf = React.useCallback(props => <Leaf {...props} />, []);

    const syncProtocol = () => protocolUpsert({
        id: parseInt(id),
        name: currentName,
        description: serializeSlate(currentDescription),
        blocks: currentBlocks,
    });

    return <>
        <SharingModal
            show={showSharingModal}
            setShow={show => setShowSharingModal(show || false)}
            targetName="Protocol"
            targetPath={`/protocol/${id}`}
        />
        <Form className="mt-4">
            <Form.Group>
                <Form.Label>Protocol Title</Form.Label>
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
                    disabled={isSigned || isWitnessed}
                />;
            })}

            <div className="row">
                <Dropdown className="col-auto my-3 mx-auto">
                    <Dropdown.Toggle variant="success" id="block-add">
                        Add a new section
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setBlocks([...currentBlocks, { id: uuid.v4(), type: 'text-question' }])}>Text Question</Dropdown.Item>
                        <Dropdown.Item onClick={() => setBlocks([...currentBlocks, { id: uuid.v4(), type: 'options-question' }])}>Options Question</Dropdown.Item>
                        <Dropdown.Item onClick={() => setBlocks([...currentBlocks, { id: uuid.v4(), type: 'plate-sampler' }])}>Run Plate Sampler</Dropdown.Item>
                        <Dropdown.Item onClick={() => setBlocks([...currentBlocks, { id: uuid.v4(), type: 'plate-add-reagent' }])}>Add Reagent to Plate</Dropdown.Item>
                        <Dropdown.Item onClick={() => setBlocks([...currentBlocks, { id: uuid.v4(), type: 'plate-sequencer' }])}>Run Plate Sequencer</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>

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
                                syncProtocol();
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
                                syncProtocol();
                            }}>
                                {isWitnessed ? 'Un-sign' : 'Sign'}
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </div>

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
                            blocks: protocol.blocks && protocol.blocks.map(definition => ({ type: definition.type, definition } as Block)),
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
