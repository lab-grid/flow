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
import { auth0State, protocolsState, runsState } from '../state/atoms';
import { protocolQuery } from '../state/selectors';
import * as uuid from 'uuid';
import { DragSourceMonitor, DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd';
import { CheckCircle, Share } from 'react-bootstrap-icons';
import moment from 'moment';
import { deserializeSlate, serializeSlate } from '../slate';
import { Block } from '../models/block';
import { SharingModal } from '../components/SharingModal';
import { labflowOptions } from '../config';
import { apiFetch } from '../state/api';
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

export function ProtocolDraggableBlock({ index, block, setBlock, moveBlock, deleteBlock }: {
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
            <ProtocolBlockEditor index={index} block={block} setBlock={setBlock} deleteBlock={() => deleteBlock(block && block.id)} />
        </div>
    );
}

export interface ProtocolEditorPageParams {
    id: string;
}

export function ProtocolEditorPage() {
    const history = useHistory();
    const [showSharingModal, setShowSharingModal] = useState(false);
    const [name, setName] = useState<string | null>(null);
    const [description, setDescription] = useState<Node[] | null>(null);
    const [blocks, setBlocks] = useState<BlockDefinition[] | null>(null);
    const [formSaving, setFormSaving] = useState<boolean>(false);
    const [formSavedTime, setFormSavedTime] = useState<string | null>(null);
    const editor = React.useMemo(() => withReact(createEditor()), []);
    const { id } = useParams<ProtocolEditorPageParams>();
    const protocol = useRecoilValue(protocolQuery(parseInt(id)));
    const protocolUpsert = useRecoilCallback(({ set, snapshot }) => async (protocol: Protocol) => {
        setFormSaving(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            const method = protocol.id ? "PUT" : "POST";
            const path = protocol.id ? `protocol/${protocol.id}` : "protocol";
            const created: Protocol = await apiFetch(labflowOptions, () => auth0Client, method, path, protocol);
            set(protocolsState, state => {
                if (created.id) {
                    state.protocolCache.set(created.id, created);
                    return state;
                } else {
                    throw new Error("Received a protocol without an ID from server!");
                }
            });
        } finally {
            setFormSaving(false);
            setFormSavedTime(moment().format());
        }
    });
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
        return created;
    });

    const currentName = name || (protocol && protocol.name) || "";
    const currentDescription = description || (protocol && protocol.description && deserializeSlate(protocol.description)) || initialSlateValue;
    const currentBlocks = blocks || (protocol && protocol.blocks) || [];

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

    // Slate helpers.
    const renderElement = React.useCallback(props => <Element {...props} />, []);
    const renderLeaf = React.useCallback(props => <Leaf {...props} />, []);

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
                />;
            })}

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
                <Dropdown className="col-auto">
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
                <Button
                    className="col-auto ml-3"
                    variant="primary"
                    onClick={() => protocolUpsert({
                        id: parseInt(id),
                        name: currentName,
                        description: serializeSlate(currentDescription),
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
                <div className="col"></div>
                <div className="col-auto my-auto">
                    {formSavedTime && <><CheckCircle /> Last saved on: {moment(formSavedTime).format('LLLL')}</>}
                </div>
            </div>
        </Form>
    </>;
}
