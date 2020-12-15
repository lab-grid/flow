import React from 'react';
import { Form, Dropdown } from 'react-bootstrap';
import { BlockDefinition } from '../models/block-definition';
import { SectionDefinition } from '../models/protocol';
import { Draggable } from './Draggable';
import { ProtocolBlockEditor } from './ProtocolBlockEditor';
import * as uuid from 'uuid';

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
          <h3><Form.Label>Protocol section {index + 1}:</Form.Label></h3>
          <Form.Control
            disabled={disabled}
            type="text"
            placeholder="Enter the title. A section has a signature block during a run."
            value={(section && section.name) || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSectionTitle((e.target as HTMLInputElement).value)}
          />
        </Form.Group>

        {currentBlocks.map((block, index) => {
            if (!block || !block.id) {
                return undefined;
            }
            return <Draggable key={block.id} type="protocol-block" index={index} move={moveBlock}>
                <ProtocolBlockEditor disabled={disabled} index={index} block={block} setBlock={updateBlock} deleteBlock={() => deleteBlock(block && block.id)} />
            </Draggable>
        })}
        

        {
            !disabled && <div className="d-flex">
                <Dropdown className="col-auto my-3 mx-auto">
                    <Dropdown.Toggle variant="success" id="block-add">
                        Add a new block
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'text-question' })}>Text Question</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'options-question' })}>Options Question</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'plate-sampler' })}>Run Plate Sampler</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'plate-add-reagent' })}>Add Reagent to Plate</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'start-timestamp' })}>Start Timestamp</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'end-timestamp' })}>End Timestamp</Dropdown.Item>
                        <Dropdown.Item onClick={() => addBlock({ id: uuid.v4(), type: 'plate-sequencer' })}>Run Plate Sequencer</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        }
    </>
}
