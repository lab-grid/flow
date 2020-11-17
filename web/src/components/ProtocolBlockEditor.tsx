import React from 'react';
import { Button, Dropdown, DropdownButton, Form, FormControl, InputGroup } from 'react-bootstrap';
import { GripHorizontal, Trash } from 'react-bootstrap-icons';
import { BlockDefinition, BlockOption, EndThermocyclerBlockDefinition, OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, PlateSequencerBlockDefinition, StartThermocyclerBlockDefinition, TextQuestionBlockDefinition } from '../models/block-definition';
import { trimEmpty } from '../utils';
import * as uuid from 'uuid';

export function humanizeBlockType(blockType: "text-question" | "options-question" | "plate-sampler" | "plate-add-reagent" | "start-thermocycler" | "end-thermocycler" | "plate-sequencer" | undefined): string {
    switch (blockType) {
        case 'text-question':
            return 'Answer Question';
        case 'options-question':
            return 'Answer Multiple Choice Question';
        case 'plate-sampler':
            return 'Run Plate Sampler';
        case 'plate-add-reagent':
            return 'Add Reagent to Plate';
        case 'start-thermocycler':
            return 'Start Thermocycler';
        case 'end-thermocycler':
            return 'End Thermocycler';
        case 'plate-sequencer':
            return 'Run Plate Sequencer';
        default:
            return `Error: Unrecognized block type: ${blockType}`;
    }
}

function BlockLabel({ index, blockType }: {
    index: number;
    blockType?: "text-question" | "options-question" | "plate-sampler" | "plate-add-reagent" | "start-thermocycler" | "end-thermocycler" | "plate-sequencer";
}) {
    return <div className="mb-2">
        <GripHorizontal /> Step {index+1} - {humanizeBlockType(blockType)}
    </div>;
}

function ProtocolBlockNameEditor({ disabled, name, setName, deleteStep }: {
    disabled?: boolean;
    name?: string;
    setName: (name?: string) => void;
    deleteStep: () => void;
}) {
    return (
        <Form.Group>
            <InputGroup>
                <FormControl
                    disabled={disabled}
                    placeholder="Enter a step name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
                />
                {!disabled &&
                    <InputGroup.Append>
                        <Button variant="danger" onClick={deleteStep}>Delete Step</Button>
                    </InputGroup.Append>
                }
            </InputGroup>
        </Form.Group>
    );
}

function ProtocolBlockOptionsEditor({ disabled, options, setOptions }: {
    disabled?: boolean;
    options?: BlockOption[];
    setOptions: (options?: BlockOption[]) => void;
}) {
    const currentOptions = trimEmpty(options, option => option.option);
    currentOptions.push({ id: uuid.v4(), option: "" });
    return <>
        <Form.Label>
            Options
        </Form.Label>
        {currentOptions.map((option, i) => <ProtocolBlockOptionEditor
            disabled={disabled}
            deletable={currentOptions.length - 1 !== i}
            key={option.id}
            option={option.option}
            setOption={option => {
                const newOptions = [...currentOptions];
                newOptions[i].option = option || "";
                setOptions(newOptions);
            }}
            deleteOption={() => {
                const newOptions = [...currentOptions];
                newOptions.splice(i, 1);
                setOptions(newOptions);
            }}
            placeholder={(currentOptions.length - 1 === i) ? "Start typing here to add an option..." : "Blank option (will be ignored)"}
        />)}
    </>
}

function ProtocolBlockOptionEditor({ disabled, deletable, placeholder, option, setOption, deleteOption }: {
    disabled?: boolean;
    deletable?: boolean;
    placeholder?: string;
    option?: string;
    setOption: (option: string | undefined) => void;
    deleteOption: () => void;
}) {
    return <Form.Group>
        <InputGroup>
            <FormControl
                disabled={disabled}
                placeholder={placeholder}
                value={option}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOption((e.target as HTMLInputElement).value)}
            />
            {!disabled && deletable &&
                <InputGroup.Append>
                    <Button variant="secondary" onClick={deleteOption}><Trash /></Button>
                </InputGroup.Append>
            }
        </InputGroup>
    </Form.Group>
}

function ProtocolBlockOptionTypeEditor({ disabled, optionType, setOptionType }: {
    disabled?: boolean;
    optionType?: 'switch' | 'checkbox' | 'radio' | 'menu-item' | 'user';
    setOptionType: (optionType?: 'switch' | 'checkbox' | 'radio' | 'menu-item' | 'user') => void;
}) {
    return <Form.Group>
        <Form.Label>Option Type</Form.Label>
        <Form.Control
            disabled={disabled}
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

function ProtocolBlockPlateEditor<T extends number = number>({ disabled, label, plateName, plateSize, plateSizes, setPlateName: setName, setPlateSize }: {
    disabled?: boolean;
    label?: string;
    plateName?: string;
    plateSize?: T;
    plateSizes?: T[];
    setPlateName: (name?: string) => void;
    setPlateSize: (plateSize?: T) => void;
}) {
    return <Form.Group>
        {label && <Form.Label>{label}</Form.Label>}
        <InputGroup>
            <DropdownButton
                disabled={disabled}
                as={InputGroup.Prepend}
                variant="outline-secondary"
                title={`${plateSize || (plateSizes && plateSizes[0])}-well`}
                id="block-plate-size"
            >
                {(plateSizes || []).map(s => <Dropdown.Item key={s} onClick={() => setPlateSize(s)}>{s}-well</Dropdown.Item>)}
            </DropdownButton>
            <FormControl
                disabled={disabled}
                placeholder="Enter a plate type"
                aria-label="Enter a plate type"
                value={plateName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
            />
        </InputGroup>
    </Form.Group>
}

function ProtocolBlockPlateCountEditor({ disabled, plateCount, setPlateCount }: {
    disabled?: boolean;
    plateCount?: number;
    setPlateCount: (plateCount?: number) => void;
}) {
    return <Form.Group>
        <Form.Label>Number of plates to transfer</Form.Label>
        <Form.Control
            disabled={disabled}
            type="number"
            placeholder="Enter a number: 4"
            value={plateCount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlateCount(parseInt((e.target as HTMLInputElement).value))}
        />
    </Form.Group>
}

function ProtocolBlockReagentLabelEditor({ disabled, reagentLabel, setReagentLabel }: {
    disabled?: boolean;
    reagentLabel?: string;
    setReagentLabel: (reagentLabel?: string) => void;
}) {
    return <Form.Group>
        <Form.Label>Reagent Label</Form.Label>
        <Form.Control
            disabled={disabled}
            type="text"
            placeholder="Enter a name"
            value={reagentLabel}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReagentLabel((e.target as HTMLInputElement).value)}
        />
    </Form.Group>
}

export interface ProtocolBlockEditorProps {
    disabled?: boolean;
    index: number;
    block?: BlockDefinition;
    setBlock: (block?: BlockDefinition) => void;
    deleteBlock: () => void;
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
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'text-question', name })}
                    deleteStep={props.deleteBlock}
                />
            </>;
        }
        case 'options-question': {
            const block: OptionsQuestionBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'options-question', name })}
                    deleteStep={props.deleteBlock}
                />
                <ProtocolBlockOptionTypeEditor
                    disabled={props.disabled}
                    optionType={block.optionType}
                    setOptionType={optionType => props.setBlock({ ...block, type: 'options-question', optionType })}
                />
                <ProtocolBlockOptionsEditor
                    disabled={props.disabled}
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
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'plate-sampler', name })}
                    deleteStep={props.deleteBlock}
                />
                <ProtocolBlockPlateEditor
                    disabled={props.disabled}
                    label="Plate to sample"
                    plateName={block.plateName}
                    plateSize={block.plateSize}
                    plateSizes={[96]}
                    setPlateName={plateName => props.setBlock({ ...block, type: 'plate-sampler', plateName })}
                    setPlateSize={plateSize => props.setBlock({ ...block, type: 'plate-sampler', plateSize })}
                />
                <ProtocolBlockPlateCountEditor
                    disabled={props.disabled}
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
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'plate-add-reagent', name })}
                    deleteStep={props.deleteBlock}
                />
                <ProtocolBlockPlateEditor
                    disabled={props.disabled}
                    label="Plate to add reagent to"
                    plateName={block.plateName}
                    plateSize={block.plateSize}
                    plateSizes={[384, 96]}
                    setPlateName={plateName => props.setBlock({ ...block, type: 'plate-add-reagent', plateName })}
                    setPlateSize={plateSize => props.setBlock({ ...block, type: 'plate-add-reagent', plateSize })}
                />
                <ProtocolBlockReagentLabelEditor
                    disabled={props.disabled}
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
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'plate-sequencer', name })}
                    deleteStep={props.deleteBlock}
                />
                <ProtocolBlockPlateEditor
                    disabled={props.disabled}
                    label="Plate to sequence"
                    plateName={block.plateName}
                    plateSize={block.plateSize}
                    plateSizes={[96, 384]}
                    setPlateName={plateName => props.setBlock({ ...block, type: 'plate-sequencer', plateName })}
                    setPlateSize={plateSize => props.setBlock({ ...block, type: 'plate-sequencer', plateSize })}
                />
                <ProtocolBlockPlateCountEditor
                    disabled={props.disabled}
                    plateCount={block.plateCount}
                    setPlateCount={plateCount => props.setBlock({ ...block, type: 'plate-sequencer', plateCount })}
                />
            </>;
        }
        case 'start-thermocycler': {
            const block: StartThermocyclerBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'start-thermocycler', name })}
                    deleteStep={props.deleteBlock}
                />
            </>;
        }
        case 'end-thermocycler': {
            const block: EndThermocyclerBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'end-thermocycler', name })}
                    deleteStep={props.deleteBlock}
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
