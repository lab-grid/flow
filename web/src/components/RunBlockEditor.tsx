import React, { useState } from 'react';
import { Button, Form, FormControl, InputGroup, Table } from 'react-bootstrap';
import { UpcScan } from 'react-bootstrap-icons';
import { TextQuestionBlock, OptionsQuestionBlock, PlateSamplerBlock, PlateAddReagentBlock, PlateSequencerBlock, Block, PlateCoordinate } from '../models/block';
import { OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, PlateSequencerBlockDefinition, TextQuestionBlockDefinition } from '../models/block-definition';
import { TableUploadModal } from './TableUploadModal';

function RunBlockTextQuestion({disabled, definition, answer, setAnswer}: {
    disabled?: boolean;
    definition: TextQuestionBlockDefinition;
    answer?: string;
    setAnswer: (answer?: string) => void;
}) {
    return (
        <Form.Group>
            <Form.Label>{definition.name}</Form.Label>
            <Form.Control
                disabled={disabled}
                type="text"
                value={answer}
                onInput={(e: React.FormEvent<HTMLInputElement>) => setAnswer((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
    );
}

function RunBlockOptionsQuestion({disabled, definition, answer, setAnswer}: {
    disabled?: boolean;
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
                <Form.Label>{definition.name || 'Select an option'}</Form.Label>
                {definition.options && definition.options.map(option => <Form.Check
                    disabled={disabled}
                    key={option.id}
                    radioGroup="run-block"
                    type={optionType}
                    id={`run-block-${option.id}`}
                    label={option}
                    onClick={() => setAnswer(option.option)}
                />)}
            </div>
        case 'menu-item':
        case 'user':
            return <Form.Group>
                <Form.Label>{definition.name || 'Select an option'}</Form.Label>
                <Form.Control
                    disabled={disabled}
                    as="select"
                    value={answer}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAnswer((e.target as HTMLSelectElement).value)}
                >
                    {definition.options && definition.options.map(option => <option key={option.id}>{option.option}</option>)}
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

interface plateLabelRow {
    plate?: string;
    cell?: string;
    sample?: string | number;
}

const cellRegex = /^([A-Za-z]+)([0-9]+)$/;

function cellToCoordinate(cell?: string): PlateCoordinate {
    if (!cell) {
        return {};
    }

    const [, rowRaw, columnRaw] = cell.match(cellRegex);

    let row = 0;
    const lowerRowRaw = rowRaw.toLocaleLowerCase();
    for (let i = 0; i < lowerRowRaw.length; i++) {
        row += (lowerRowRaw.charCodeAt(i) - 97) * Math.pow(10, lowerRowRaw.length - 1 - i);
    }

    return {
        row,
        col: parseInt(columnRaw),
    };
}

function RunBlockPlateLabelUploader({disabled, wells, plateLabel, setCoordinates}: {
    disabled?: boolean;
    wells?: number;
    plateLabel?: string;
    setCoordinates: (plateLabel: string, coordinates: PlateCoordinate[]) => void;
}) {
    const [showUploader, setShowUploader] = useState(false);

    const parseAndSetCoordinates = (data: plateLabelRow[]) => {
        const results: {[label: string]: PlateCoordinate[]} = {};
        for (const row of data) {
            if (!row.plate) {
                console.warn('Found a row with no plate!', row);
                return;
            }
            if (!results[row.plate]) {
                results[row.plate] = [];
            }
            const coordinate = cellToCoordinate(row.cell);
            coordinate.sampleLabel = typeof row.sample === 'string' ? undefined : row.sample;
            results[row.plate].push(coordinate);
        }
        const labels = Object.keys(results);
        if (labels.length === 0) {
            console.warn('Uploaded table contained no plate data', data, results);
            return;
        }
        if (labels.length > 1) {
            console.warn('Uploaded barcode data from multiple plates! Only using first plate...', data, results);
        }
        setCoordinates(labels[0], results[labels[0]]);
        setShowUploader(false);
    }

    return <>
        <TableUploadModal
            columns={{
                'plate': 0,
                'cell': 1,
                'sample': 2,
            }}
            show={showUploader}
            setShow={setShowUploader}
            setTable={parseAndSetCoordinates}
        />
        <InputGroup>
            <InputGroup.Prepend>
                <InputGroup.Text>{wells || 96}-well</InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
                disabled={true}
                placeholder={plateLabel ? `Plate ID: ${plateLabel}. Mappings saved...` : "Upload plate mapping csv"}
                aria-label={plateLabel ? `Plate ID: ${plateLabel}. Mappings saved...` : "Upload plate mapping csv"}
            />
            <InputGroup.Append>
                <Button variant="secondary" disabled={disabled} onClick={() => setShowUploader(true)}>
                    <UpcScan /> Scan
                </Button>
            </InputGroup.Append>
        </InputGroup>
    </>
}

function RunBlockPlateLabelEditor({disabled, wells, label, setLabel}: {
    disabled?: boolean;
    wells?: number;
    label?: string;
    setLabel: (label?: string) => void;
}) {
    return <InputGroup>
        <InputGroup.Prepend>
            <InputGroup.Text>{wells || 96}-well</InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl
            disabled={disabled}
            placeholder="Enter a plate label"
            aria-label="Enter a plate label"
            value={label}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel((e.target as HTMLInputElement).value)}
        />
        <InputGroup.Append>
            <Button variant="secondary" disabled={true}>
                <UpcScan /> Scan
            </Button>
        </InputGroup.Append>
    </InputGroup>
}

function RunBlockPlateSamplerEditor({disabled, definition, outputPlateLabel, setOutputPlateLabel, mappings, setMappings}: {
    disabled?: boolean;
    definition: PlateSamplerBlockDefinition;
    outputPlateLabel?: string;
    setOutputPlateLabel: (outputPlateLabel?: string) => void;
    mappings?: {[label: string]: PlateCoordinate[]};
    setMappings: (mappings: {[label: string]: PlateCoordinate[]}) => void;
}) {
    const plates = mappings && Object.keys(mappings);
    const inputRows: JSX.Element[] = [];
    for (let i = 0; i < (definition.plateCount || 0); i++) {
        const label = plates && plates[i];
        inputRows.push(<tr key={i}>
            <th>Input Plate {i}</th>
            <td>
                <RunBlockPlateLabelUploader
                    disabled={disabled}
                    wells={definition.plateSize}
                    plateLabel={label}
                    setCoordinates={(label, coordinates) => {
                        const newMappings = {...mappings};
                        newMappings[label] = coordinates;
                        setMappings(newMappings);
                    }}
                />
            </td>
        </tr>);
    }
    const outputRows: JSX.Element = (
        <tr>
            <th>Output Plate</th>
            <td>
                <RunBlockPlateLabelEditor
                    disabled={disabled}
                    wells={384}
                    label={outputPlateLabel}
                    setLabel={setOutputPlateLabel}
                />
            </td>
        </tr>
    );
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

function RunBlockPlateAddReagentEditor({disabled, definition, plateLabel, setPlateLabel}: {
    disabled?: boolean;
    definition: PlateAddReagentBlockDefinition;
    plateLabel?: string;
    setPlateLabel: (plateLabel?: string) => void;
}) {
    return (
        <Form.Group>
            <Form.Label>Plate with reagent ({definition.reagentLabel}) added</Form.Label>
            <RunBlockPlateLabelEditor
                disabled={disabled}
                wells={definition.plateSize}
                label={plateLabel}
                setLabel={setPlateLabel}
            />
        </Form.Group>
    );
}

function RunBlockPlateSequencerEditor({disabled, definition/* , plateLabel, setPlateLabel */}: {
    disabled?: boolean;
    definition: PlateSequencerBlockDefinition;
    // plateLabel?: string;
    // setPlateLabel: (plateLabel?: string) => void;
}) {
    return (
        <Form.Group>
            <Form.Label>Sequenced plate</Form.Label>
            {/* <RunBlockPlateLabelEditor
                disabled={disabled}
                wells={definition.plateSize}
                label={plateLabel}
                setLabel={setPlateLabel}
            /> */}
        </Form.Group>
    );
}

export interface RunBlockEditorProps {
    disabled?: boolean;
    block?: Block;
    setBlock: (block?: Block) => void;
}

export function RunBlockEditor(props: RunBlockEditorProps) {
    if (!props.block) {
        return (
            <div className="row">
                <Button variant="primary" disabled={props.disabled}>
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
                    disabled={props.disabled}
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
                    disabled={props.disabled}
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
                    disabled={props.disabled}
                    definition={block.definition}
                    outputPlateLabel={block.outputPlateLabel}
                    setOutputPlateLabel={outputPlateLabel => props.setBlock({ ...block, type: 'plate-sampler', outputPlateLabel })}
                    mappings={props.block && props.block.plateMappings}
                    setMappings={mappings => props.setBlock({ ...block, type: 'plate-sampler', plateMappings: mappings })}
                />
            );
        }
        case 'plate-add-reagent': {
            const block: PlateAddReagentBlock = props.block;
            return (
                <RunBlockPlateAddReagentEditor
                    disabled={props.disabled}
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
                    disabled={props.disabled}
                    definition={block.definition}
                    // plateLabel={block.plateLabel}
                    // setPlateLabel={plateLabel => props.setBlock({ ...block, type: 'plate-sequencer', plateLabel })}
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
