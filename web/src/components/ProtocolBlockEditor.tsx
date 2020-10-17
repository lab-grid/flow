import React from 'react';
import { Button, Dropdown, DropdownButton, Form, FormControl, InputGroup } from 'react-bootstrap';
import { GripHorizontal, Trash } from 'react-bootstrap-icons';
import { BlockDefinition, OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, PlateSequencerBlockDefinition, TextQuestionBlockDefinition } from '../models/block-definition';
import { trimEmpty } from '../utils';

export function humanizeBlockType(blockType: "text-question" | "options-question" | "plate-sampler" | "plate-add-reagent" | "plate-sequencer" | undefined): string {
    switch (blockType) {
        case 'text-question':
            return 'Answer Question';
        case 'options-question':
            return 'Answer Multiple Choice Question';
        case 'plate-sampler':
            return 'Run Plate Sampler';
        case 'plate-add-reagent':
            return 'Add Reagent to Plate';
        case 'plate-sequencer':
            return 'Run Plate Sequencer'
        default:
            return `Error: Unrecognized block type: ${blockType}`;
    }
}

function BlockLabel({ index, blockType }: {
    index: number;
    blockType?: "text-question" | "options-question" | "plate-sampler" | "plate-add-reagent" | "plate-sequencer";
}) {
    return <div className="mb-2">
        <GripHorizontal /> Step {index+1} - {humanizeBlockType(blockType)}
    </div>;
}

function ProtocolBlockNameEditor({ name, setName }: {
    name?: string;
    setName: (name?: string) => void;
}) {
    return (
        <Form.Group>
            <InputGroup>
                <FormControl
                    placeholder="Enter a step name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
                />
                <InputGroup.Append>
                    <Button variant="danger">Delete Step</Button>
                </InputGroup.Append>
            </InputGroup>
        </Form.Group>
    );
}

function ProtocolBlockOptionsEditor({ options, setOptions }: {
    options?: string[];
    setOptions: (options?: string[]) => void;
}) {
    const currentOptions = trimEmpty(options);
    currentOptions.push("");
    return <>
        <Form.Label>
            Options
        </Form.Label>
        {currentOptions.map((option, i) => <ProtocolBlockOptionEditor
            key={i}
            option={option}
            setOption={(option) => {
                const newOptions = [...currentOptions];
                newOptions[i] = option || "";
                setOptions(newOptions);
            }}
            placeholder={(currentOptions.length - 1 === i) ? "Start typing here to add an option..." : "Blank option (will be ignored)"}
        />)}
    </>
}

function ProtocolBlockOptionEditor({ placeholder, option, setOption }: {
    placeholder?: string;
    option?: string;
    setOption: (option: string | undefined) => void;
}) {
    return <Form.Group>
        <InputGroup>
            <FormControl
                placeholder={placeholder}
                value={option}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOption((e.target as HTMLInputElement).value)}
            />
            <InputGroup.Append>
                <Button variant="secondary"><Trash /></Button>
            </InputGroup.Append>
        </InputGroup>
    </Form.Group>
}

function ProtocolBlockOptionTypeEditor({ optionType, setOptionType }: {
    optionType?: 'switch' | 'checkbox' | 'radio' | 'menu-item' | 'user';
    setOptionType: (optionType?: 'switch' | 'checkbox' | 'radio' | 'menu-item' | 'user') => void;
}) {
    return <Form.Group>
        <Form.Label>Option Type</Form.Label>
        <Form.Control
            as="select"
            value={optionType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOptionType((e.target as HTMLSelectElement).value as 'switch' | 'checkbox' | 'radio' | 'menu-item' | 'user')}
        >
            <option value="switch">Toggle Switches</option>
            <option value="checkbox">Checkboxes</option>
            <option value="radio">Radio Buttons</option>
            <option value="menu-item">Dropdown Menu</option>
            <option value="user">User</option>
        </Form.Control>
    </Form.Group>
}

function ProtocolBlockPlateEditor<T extends number = number>({ label, name, plateSize, plateSizes, setName, setPlateSize }: {
    label?: string;
    name?: string;
    plateSize?: T;
    plateSizes?: T[];
    setName: (name?: string) => void;
    setPlateSize: (plateSize?: T) => void;
}) {
    return <Form.Group>
        {label && <Form.Label>{label}</Form.Label>}
        <InputGroup>
            <DropdownButton
                as={InputGroup.Prepend}
                variant="outline-secondary"
                title={`${plateSize || (plateSizes && plateSizes[0])}-well`}
                id="block-plate-size"
            >
                {(plateSizes || []).map(s => <Dropdown.Item key={s} onClick={() => setPlateSize(s)}>{s}-well</Dropdown.Item>)}
            </DropdownButton>
            <FormControl
                placeholder="Enter a plate label"
                aria-label="Enter a plate label"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
            />
        </InputGroup>
    </Form.Group>
}

function ProtocolBlockPlateCountEditor({ plateCount, setPlateCount }: {
    plateCount?: number;
    setPlateCount: (plateCount?: number) => void;
}) {
    return <Form.Group>
        <Form.Label>Number of plates</Form.Label>
        <Form.Control
            type="number"
            placeholder="Enter a number"
            value={plateCount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlateCount(parseInt((e.target as HTMLInputElement).value))}
        />
    </Form.Group>
}

function ProtocolBlockReagentLabelEditor({ reagentLabel, setReagentLabel }: {
    reagentLabel?: string;
    setReagentLabel: (reagentLabel?: string) => void;
}) {
    return <Form.Group>
        <Form.Label>Reagent Label</Form.Label>
        <Form.Control
            type="text"
            placeholder="Enter a name"
            value={reagentLabel}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReagentLabel((e.target as HTMLInputElement).value)}
        />
    </Form.Group>
}

export interface ProtocolBlockEditorProps {
    index: number;
    block?: BlockDefinition;
    setBlock: (block?: BlockDefinition) => void;
}

export function ProtocolBlockEditor(props: ProtocolBlockEditorProps) {
    if (!props.block) {
        return (
            <div className="row">
                <Button variant="primary">
                    Select a block type
                </Button>
            </div>
        );
    }

    switch (props.block.type) {
        case 'text-question': {
            const block: TextQuestionBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'text-question', name })}
                />
            </>;
        }
        case 'options-question': {
            const block: OptionsQuestionBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'options-question', name })}
                />
                <ProtocolBlockOptionTypeEditor
                    optionType={block.optionType}
                    setOptionType={optionType => props.setBlock({ ...block, type: 'options-question', optionType })}
                />
                <ProtocolBlockOptionsEditor
                    options={block.options}
                    setOptions={options => props.setBlock({ ...block, type: 'options-question', options })}
                />
            </>;
        }
        case 'plate-sampler': {
            const block: PlateSamplerBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'plate-sampler', name })}
                />
                <ProtocolBlockPlateEditor
                    label="Plate to sample"
                    name={block.name}
                    plateSize={block.plateSize}
                    plateSizes={[96]}
                    setName={name => props.setBlock({ ...block, type: 'plate-sampler', name })}
                    setPlateSize={plateSize => props.setBlock({ ...block, type: 'plate-sampler', plateSize })}
                />
                <ProtocolBlockPlateCountEditor
                    plateCount={block.plateCount}
                    setPlateCount={plateCount => props.setBlock({ ...block, type: 'plate-sampler', plateCount })}
                />
            </>;
        }
        case 'plate-add-reagent': {
            const block: PlateAddReagentBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'plate-add-reagent', name })}
                />
                <ProtocolBlockPlateEditor
                    label="Plate to add reagent to"
                    name={block.name}
                    plateSize={block.plateSize}
                    plateSizes={[96, 384]}
                    setName={name => props.setBlock({ ...block, type: 'plate-add-reagent', name })}
                    setPlateSize={plateSize => props.setBlock({ ...block, type: 'plate-add-reagent', plateSize })}
                />
                <ProtocolBlockReagentLabelEditor
                    reagentLabel={block.reagentLabel}
                    setReagentLabel={reagentLabel => props.setBlock({ ...block, type: 'plate-add-reagent', reagentLabel })}
                />
            </>;
        }
        case 'plate-sequencer': {
            const block: PlateSequencerBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'plate-sequencer', name })}
                />
                <ProtocolBlockPlateEditor
                    label="Plate to sequence"
                    name={block.name}
                    plateSize={block.plateSize}
                    plateSizes={[96, 384]}
                    setName={name => props.setBlock({ ...block, type: 'plate-sequencer', name })}
                    setPlateSize={plateSize => props.setBlock({ ...block, type: 'plate-sequencer', plateSize })}
                />
            </>;
        }
        default:
            return (
                <div>
                    TODO: ProtocolBlockEditor
                </div>
            );
    }
}
