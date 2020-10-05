import React from 'react';
import { Button, Form, FormControl, InputGroup } from 'react-bootstrap';
import { BlockDefinition, OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, PlateSequencerBlockDefinition, TextQuestionBlockDefinition } from '../models/block-definition';

function ProtocolBlockQuestionEditor({question, setQuestion}: {
    question?: string;
    setQuestion: (question?: string) => void;
}) {
    return (
        <Form.Group>
            <Form.Label>Question</Form.Label>
            <Form.Control
                type="text"
                placeholder="Enter a question"
                value={question}
                onInput={(e: React.FormEvent<HTMLInputElement>) => setQuestion((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
    );
}

function ProtocolBlockOptionsEditor({options, setOptions}: {
    options?: string[];
    setOptions: (options?: string[]) => void;
}) {
    return <>
        {options && options.map((option, i) => <ProtocolBlockOptionEditor
            option={option}
            optionIndex={i}
            setOption={(option, optionIndex) => {
                if (options && option) {
                    const newOptions = [...(options || [])]
                    newOptions[optionIndex] = option;
                    setOptions(newOptions);
                }
            }}
        />)}
        <Form.Group controlId="block-option-add">
            <Form.Control
                type="text"
                placeholder="Add an option"
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    setOptions([...(options || []), (e.target as HTMLInputElement).value]);
                }}
            />
        </Form.Group>
    </>
}

function ProtocolBlockOptionEditor({option, optionIndex, setOption}: {
    option?: string;
    optionIndex: number;
    setOption: (option: string | undefined, optionIndex: number) => void;
}) {
    return <Form.Group controlId={`block-option-${optionIndex}`}>
        <InputGroup>
            <FormControl
                placeholder="Blank option (will be ignored)"
                value={option}
                onInput={(e: React.FormEvent<HTMLInputElement>) => setOption((e.target as HTMLInputElement).value, optionIndex)}
            />
            <InputGroup.Append>
                <Button variant="danger">Delete</Button>
            </InputGroup.Append>
        </InputGroup>
    </Form.Group>
}

function ProtocolBlockOptionTypeEditor({optionType, setOptionType}: {
    optionType?: 'switch' | 'checkbox' | 'radio' | 'menu-item' | 'user';
    setOptionType: (optionType?: 'switch' | 'checkbox' | 'radio' | 'menu-item' | 'user') => void;
}) {
    return <div>
        <Form.Check inline radioGroup="block-option-type" label="switch" type="radio" id={`block-option-type-switch`} checked={optionType === 'switch'} onChange={() => setOptionType('switch')} />
        <Form.Check inline radioGroup="block-option-type" label="checkbox" type="radio" id={`block-option-type-checkbox`} checked={optionType === 'checkbox'} onChange={() => setOptionType('checkbox')} />
        <Form.Check inline radioGroup="block-option-type" label="radio" type="radio" id={`block-option-type-radio`} checked={optionType === 'radio'} onChange={() => setOptionType('radio')} />
        <Form.Check inline radioGroup="block-option-type" label="menu-item" type="radio" id={`block-option-type-menu-item`} checked={optionType === 'menu-item'} onChange={() => setOptionType('menu-item')} />
        <Form.Check inline radioGroup="block-option-type" label="user" type="radio" id={`block-option-type-user`} checked={optionType === 'user'} onChange={() => setOptionType('user')} />
    </div>
}

function ProtocolBlockNameEditor({name, setName}: {
    name?: string;
    setName: (name?: string) => void;
}) {
    return <Form.Group>
        <Form.Label>Plate Label</Form.Label>
        <Form.Control
            type="text"
            placeholder="Enter a name"
            value={name}
            onInput={(e: React.FormEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
        />
    </Form.Group>
}

function ProtocolBlockPlateCountEditor({plateCount, setPlateCount}: {
    plateCount?: number;
    setPlateCount: (plateCount?: number) => void;
}) {
    return <Form.Group>
        <Form.Label>Number of plates</Form.Label>
        <Form.Control
            type="number"
            placeholder="Enter a name"
            value={plateCount}
            onInput={(e: React.FormEvent<HTMLInputElement>) => setPlateCount(parseInt((e.target as HTMLInputElement).value))}
        />
    </Form.Group>
}

function ProtocolBlockPlateSizeEditor<T extends number = number>({plateSize, plateSizes, setPlateSize}: {
    plateSize?: T;
    plateSizes?: T[];
    setPlateSize: (plateSize?: T) => void;
}) {
    return <Form.Group>
        <Form.Label>Size of plates</Form.Label>
        <Form.Control
            as="select"
            value={plateSize}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlateSize(parseInt((e.target as HTMLSelectElement).value) as any)}
        >
            {plateSizes && plateSizes.map(plateSize => <option>{plateSize}</option>)}
        </Form.Control>
    </Form.Group>
}

function ProtocolBlockReagentLabelEditor({reagentLabel, setReagentLabel}: {
    reagentLabel?: string;
    setReagentLabel: (reagentLabel?: string) => void;
}) {
    return <Form.Group>
        <Form.Label>Reagent Label</Form.Label>
        <Form.Control
            type="text"
            placeholder="Enter a name"
            value={reagentLabel}
            onInput={(e: React.FormEvent<HTMLInputElement>) => setReagentLabel((e.target as HTMLInputElement).value)}
        />
    </Form.Group>
}

export interface ProtocolBlockEditorProps {
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
            return (
                <ProtocolBlockQuestionEditor
                    question={block.question}
                    setQuestion={question => props.setBlock({ ...block, type: 'text-question', question })}
                />
            );
        }
        case 'options-question': {
            const block: OptionsQuestionBlockDefinition = props.block;
            return <>
                <ProtocolBlockQuestionEditor
                    question={block.question}
                    setQuestion={question => props.setBlock({ ...block, type: 'options-question', question })}
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
                <ProtocolBlockNameEditor
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'plate-sampler', name })}
                />
                <ProtocolBlockPlateCountEditor
                    plateCount={block.plateCount}
                    setPlateCount={plateCount => props.setBlock({ ...block, type: 'plate-sampler', plateCount })}
                />
                <ProtocolBlockPlateSizeEditor
                    plateSize={block.plateSize}
                    setPlateSize={plateSize => props.setBlock({ ...block, type: 'plate-sampler', plateSize })}
                />
            </>;
        }
        case 'plate-add-reagent': {
            const block: PlateAddReagentBlockDefinition = props.block;
            return <>
                <ProtocolBlockNameEditor
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'plate-add-reagent', name })}
                />
                <ProtocolBlockPlateSizeEditor
                    plateSize={block.plateSize}
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
                <ProtocolBlockNameEditor
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'plate-sequencer', name })}
                />
                <ProtocolBlockPlateSizeEditor
                    plateSize={block.plateSize}
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
