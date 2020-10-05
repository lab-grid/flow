import React from 'react';
import { Button, Form, FormControl, InputGroup, Tab, Table } from 'react-bootstrap';
import { TextQuestionBlock, OptionsQuestionBlock, PlateSamplerBlock, PlateAddReagentBlock, PlateSequencerBlock, Block } from '../models/block';
import { BlockDefinition, OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, PlateSequencerBlockDefinition, TextQuestionBlockDefinition } from '../models/block-definition';

function RunBlockTextQuestion({definition, answer, setAnswer}: {
    definition: TextQuestionBlockDefinition;
    answer?: string;
    setAnswer: (answer?: string) => void;
}) {
    return (
        <Form.Group>
            <Form.Label>{definition.question}</Form.Label>
            <Form.Control
                type="text"
                value={answer}
                onInput={(e: React.FormEvent<HTMLInputElement>) => setAnswer((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
    );
}

function RunBlockOptionsQuestion({definition, answer, setAnswer}: {
    definition: OptionsQuestionBlockDefinition;
    answer?: string;
    setAnswer: (answer?: string) => void;
}) {
    switch (definition.optionType) {
        case 'switch':
        case 'radio':
        case 'checkbox':
        default:
            const optionType: 'switch' | 'radio' | 'checkbox' = definition.optionType || 'checkbox';
            return <div>
                <Form.Label>{definition.question || 'Select an option'}</Form.Label>
                {definition.options && definition.options.map((option, i) => <Form.Check
                    radioGroup="run-block"
                    type={optionType}
                    id={`run-block-${i}`}
                    label={option}
                    onClick={() => setAnswer(option)}
                />)}
            </div>
        case 'menu-item':
        case 'user':
            return <Form.Group>
                <Form.Label>{definition.question || 'Select an option'}</Form.Label>
                <Form.Control
                    as="select"
                    value={answer}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAnswer((e.target as HTMLSelectElement).value)}
                >
                    {definition.options && definition.options.map(option => <option>{option}</option>)}
                </Form.Control>
            </Form.Group>
    }
}

function cloneArrayToSize<T>(size: number, defaultValue: T, original?: T[]): T[] {
    const newPlateLabels = new Array<T>(size);
    for (let i = 0; i < size; i++) {
        if (original && original.length > i) {
            newPlateLabels[i] = original[i];
        } else {
            newPlateLabels[i] = defaultValue;
        }
    }
    return newPlateLabels;
}

function RunBlockPlateSamplerEditor({definition, outputPlateLabel, setOutputPlateLabel, plateLabels, setPlateLabels}: {
    definition: PlateSamplerBlockDefinition;
    outputPlateLabel?: string;
    setOutputPlateLabel: (outputPlateLabel?: string) => void;
    plateLabels?: string[];
    setPlateLabels: (plateLabels?: string[]) => void;
}) {
    const inputRows: JSX.Element[] = [];
    for (let i = 0; i < (definition.plateCount || 0); i++) {
        inputRows.push(<tr>
            <th>Input Plate {i}</th>
            <td>
                <Form.Control
                    type="text"
                    value={plateLabels ? plateLabels[i] : undefined}
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const newPlateLabels = cloneArrayToSize(definition.plateCount || 0, '', plateLabels);
                        newPlateLabels[i] = (e.target as HTMLInputElement).value;
                        setPlateLabels(newPlateLabels);
                    }}
                />
            </td>
        </tr>);
    }
    const outputRows: JSX.Element[] = [
        <tr>
            <th>Output Plate</th>
            <td>
                <Form.Control
                    type="text"
                    value={outputPlateLabel}
                    onInput={(e: React.FormEvent<HTMLInputElement>) => setOutputPlateLabel((e.target as HTMLInputElement).value)}
                />
            </td>
        </tr>
    ]
    return <Table>
        <thead>
            <tr>
                <th>#</th>
                <th>Plate Label</th>
            </tr>
        </thead>
        <tbody>
            {inputRows}
            {outputRows}
        </tbody>
    </Table>
}

function RunBlockPlateAddReagentEditor({definition, plateLabel, setPlateLabel}: {
    definition: PlateAddReagentBlockDefinition;
    plateLabel?: string;
    setPlateLabel: (plateLabel?: string) => void;
}) {
    return (
        <Form.Group>
            <Form.Label>Plates with reagent ({definition.reagentLabel}) added</Form.Label>
            <Form.Control
                type="text"
                value={plateLabel}
                onInput={(e: React.FormEvent<HTMLInputElement>) => setPlateLabel((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
    );
}

function RunBlockPlateSequencerEditor({definition, plateLabel, setPlateLabel}: {
    definition: PlateSequencerBlockDefinition;
    plateLabel?: string;
    setPlateLabel: (plateLabel?: string) => void;
}) {
    return (
        <Form.Group>
            <Form.Label>Sequenced plate</Form.Label>
            <Form.Control
                type="text"
                value={plateLabel}
                onInput={(e: React.FormEvent<HTMLInputElement>) => setPlateLabel((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
    );
}

export interface RunBlockEditorProps {
    block?: Block;
    setBlock: (block?: Block) => void;
}

export function RunBlockEditor(props: RunBlockEditorProps) {
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
            const block: TextQuestionBlock = props.block;
            return (
                <RunBlockTextQuestion
                    definition={block.definition}
                    answer={block.answer}
                    setAnswer={answer => props.setBlock({ ...block, type: 'text-question', answer })}
                />
            );
        }
        case 'options-question': {
            const block: OptionsQuestionBlock = props.block;
            return (
                <RunBlockOptionsQuestion
                    definition={block.definition}
                    answer={block.answer}
                    setAnswer={answer => props.setBlock({ ...block, type: 'options-question', answer })}
                />
            );
        }
        case 'plate-sampler': {
            const block: PlateSamplerBlock = props.block;
            return (
                <RunBlockPlateSamplerEditor
                    definition={block.definition}
                    outputPlateLabel={block.outputPlateLabel}
                    setOutputPlateLabel={outputPlateLabel => props.setBlock({ ...block, type: 'plate-sampler', outputPlateLabel })}
                    plateLabels={block.plateLabels}
                    setPlateLabels={plateLabels => props.setBlock({ ...block, type: 'plate-sampler', plateLabels })}
                />
            );
        }
        case 'plate-add-reagent': {
            const block: PlateAddReagentBlock = props.block;
            return (
                <RunBlockPlateAddReagentEditor
                    definition={block.definition}
                    plateLabel={block.plateLabel}
                    setPlateLabel={plateLabel => props.setBlock({ ...block, type: 'plate-add-reagent', plateLabel })}
                />
            );
        }
        case 'plate-sequencer': {
            const block: PlateSequencerBlock = props.block;
            return (
                <RunBlockPlateSequencerEditor
                    definition={block.definition}
                    plateLabel={block.plateLabel}
                    setPlateLabel={plateLabel => props.setBlock({ ...block, type: 'plate-sequencer', plateLabel })}
                />
            );
        }
        default:
            return (
                <div>
                    TODO: RunBlockEditor
                </div>
            );
    }
}
