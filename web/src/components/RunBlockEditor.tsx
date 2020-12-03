import moment from 'moment';
import React, { useState } from 'react';
import { Button, Dropdown, DropdownButton, Form, FormControl, InputGroup, Table } from 'react-bootstrap';
import { UpcScan } from 'react-bootstrap-icons';
import { TextQuestionBlock, OptionsQuestionBlock, PlateSamplerBlock, PlateAddReagentBlock, PlateSequencerBlock, Block, PlateCoordinate, PlateResult, StartTimestampBlock, EndTimestampBlock } from '../models/block';
import { BlockPrimer, EndTimestampBlockDefinition, OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, PlateSequencerBlockDefinition, StartTimestampBlockDefinition, TextQuestionBlockDefinition } from '../models/block-definition';
import { TableUploadModal } from './TableUploadModal';
import { Calculator } from './Calculator';
import DatePicker from "react-datepicker";

function RunBlockLabel({ name }: {
    name?: string;
}) {
    return <h4 className="row">{name}</h4>
}

function RunBlockTextQuestion({ disabled, definition, answer, setAnswer }: {
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnswer((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
    );
}

function RunBlockOptionsQuestion({ disabled, definition, answer, setAnswer }: {
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
                <h4 className="row">{definition.name}</h4>
                {definition.options && definition.options.filter(({id, option}) => id && option).map(option => <Form.Check
                    disabled={disabled}
                    key={option.id}
                    radioGroup="run-block"
                    type={optionType}
                    id={`run-block-${option.id}`}
                    label={option.option}
                    onClick={() => setAnswer(option.option)}
                />)}
            </div>
        case 'menu-item':
        case 'user':
            return <Form.Group>
                <h4 className="row">{definition.name}</h4>
                <Form.Control
                    disabled={disabled}
                    as="select"
                    value={answer}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAnswer((e.target as HTMLSelectElement).value)}
                >
                    {definition.options && definition.options.filter(({id, option}) => id && option).map(option => <option key={option.id}>{option.option}</option>)}
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

function cellToRowCol(cell: string): [number, number] {
    const [, rowRaw, columnRaw] = cell.match(cellRegex);

    let row = 0;
    const lowerRowRaw = rowRaw.toLocaleLowerCase();
    for (let i = 0; i < lowerRowRaw.length; i++) {
        row += (lowerRowRaw.charCodeAt(i) - 97) * Math.pow(10, lowerRowRaw.length - 1 - i);
    }

    return [row, parseInt(columnRaw)];
}

function cellToCoordinate(cell?: string): PlateCoordinate {
    if (!cell) {
        return {};
    }

    const [row, col] = cellToRowCol(cell);
    return { row, col };
}

function RunBlockPlateLabelUploader({ disabled, name, wells, plateLabel, setCoordinates, platePrimers, platePrimer, setPlatePrimer }: {
    disabled?: boolean;
    name?: string;
    wells?: number;
    plateLabel?: string;
    setCoordinates: (plateLabel: string, coordinates: PlateCoordinate[]) => void;
    platePrimers?: BlockPrimer[];
    platePrimer?: string;
    setPlatePrimer: (platePrimer?: string) => void;
}) {
    const [showUploader, setShowUploader] = useState(false);

    const parseAndSetCoordinates = (data: plateLabelRow[]) => {
        const results: { [label: string]: PlateCoordinate[] } = {};
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
                'plate': 1,
                'cell': 2,
                'sample': 3,
            }}
            show={showUploader}
            setShow={setShowUploader}
            setTable={parseAndSetCoordinates}
        />
        <InputGroup>
            <DropdownButton
                as={InputGroup.Prepend}
                variant="outline-secondary"
                title={platePrimer ? `Primer: ${platePrimer}` : 'Select Primer'}
            >
                {platePrimers && platePrimers.map(primer =>
                    <Dropdown.Item key={primer.id} onClick={() => setPlatePrimer(primer.primer)}>{primer.primer}</Dropdown.Item>
                )}
            </DropdownButton>
            <Form.Control
                disabled={true}
                placeholder={plateLabel ? `Plate ID: ${plateLabel}. Barcodes saved...` : "Upload sample barcodes csv"}
                aria-label={plateLabel ? `Plate ID: ${plateLabel}. Barcides saved...` : "Upload sample barcodes csv"}
            />
            <InputGroup.Append>
                {name && <InputGroup.Text>{name}</InputGroup.Text>}
                <InputGroup.Text>{wells || 96}-well</InputGroup.Text>
                <Button variant="secondary" disabled={disabled} onClick={() => setShowUploader(true)}>
                    Upload
                </Button>
            </InputGroup.Append>
        </InputGroup>
    </>
}

interface sequencerRow {
    plateLabel?: string;
    plateIndex?: number;
    plateCell?: string;
    marker1?: number;
    marker2?: number;
    classification?: string;
}

function RunBlockSequencerResultsUploader({ disabled, results, setResults }: {
    disabled?: boolean;
    results?: PlateResult[];
    setResults: (results?: PlateResult[]) => void;
}) {
    const [showUploader, setShowUploader] = useState(false);

    const parseAndSetResults = (data: sequencerRow[]) => {
        const results: PlateResult[] = [];
        for (const row of data) {
            const {plateCell, ...withoutCell} = row;
            if (!plateCell) {
                console.warn('Found a row without a cell!', row);
                return;
            }
            const [plateRow, plateCol] = cellToRowCol(plateCell);
            const result: PlateResult = {
                ...withoutCell,
                plateRow,
                plateCol,
            };
            results.push(result);
        }
        if (results.length === 0) {
            console.warn('Uploaded table contained no data', data, results);
            return;
        }
        setResults(data);
        setShowUploader(false);
    }

    return <>
        <TableUploadModal
            parseHeader={true}
            columns={{
                'plateLabel': 'Plate_ID',
                'plateIndex': 'Plate_384_Number',
                'plateCell': 'Sample_Well',
                'marker1': 'index',
                'marker2': 'index2',
                'classification': 'classification',
            }}
            show={showUploader}
            setShow={setShowUploader}
            setTable={parseAndSetResults}
        />
        <InputGroup>
            <Form.Control
                disabled={true}
                placeholder={(results && results.length) ? `Results saved (${results.length} records)...` : "Upload results csv"}
                aria-label={(results && results.length) ? `Results saved (${results.length} records)...` : "Upload results csv"}
            />
            <InputGroup.Append>
                <Button variant="secondary" disabled={disabled} onClick={() => setShowUploader(true)}>
                    Upload
                </Button>
            </InputGroup.Append>
        </InputGroup>
    </>
}

function RunBlockPlateLabelEditor({ disabled, name, wells, label, setLabel }: {
    disabled?: boolean;
    name?: string;
    wells?: number;
    label?: string;
    setLabel: (label?: string) => void;
}) {
    return <InputGroup>
        <FormControl
            disabled={disabled}
            placeholder="Scan the plate barcode"
            aria-label="Scan the plate barcode"
            value={label}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel((e.target as HTMLInputElement).value)}
        />
        <InputGroup.Append>
            {name && <InputGroup.Text>{name}</InputGroup.Text>}
            <InputGroup.Text>{wells || 96}-well</InputGroup.Text>
            <Button variant="secondary" disabled={true}>
                <UpcScan /> Scan
            </Button>
        </InputGroup.Append>
    </InputGroup>
}

function RunBlockPlateLotEditor({ disabled, lot, setLot }: {
    disabled?: boolean;
    lot?: string;
    setLot: (lot?: string) => void;
}) {
    return <InputGroup>
        <FormControl
            disabled={disabled}
            placeholder="Enter or scan the lot number"
            aria-label="Enter or scan the lot number"
            value={lot}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLot((e.target as HTMLInputElement).value)}
        />
        <InputGroup.Append>
            <Button variant="secondary" disabled={true}>
                <UpcScan /> Scan
          </Button>
        </InputGroup.Append>
    </InputGroup>
}

function RunBlockPlateSamplerEditor({ disabled, definition, outputPlateLabel, setOutputPlateLabel, mappings, setMappings, platePrimers, setPlatePrimers }: {
    disabled?: boolean;
    definition: PlateSamplerBlockDefinition;
    outputPlateLabel?: string;
    setOutputPlateLabel: (outputPlateLabel?: string) => void;
    mappings?: { [label: string]: PlateCoordinate[] };
    setMappings: (mappings: { [label: string]: PlateCoordinate[] }) => void;
    platePrimers?: { [label: string]: string };
    setPlatePrimers: (platePrimers: { [label: string]: string }) => void;
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
                    wells={definition.plates && definition.plates[i] && definition.plates[i].size}
                    name={definition.plates && definition.plates[i] && definition.plates[i].name}
                    plateLabel={label}
                    setCoordinates={(label, coordinates) => {
                        const newMappings = { ...mappings };
                        newMappings[label] = coordinates;
                        setMappings(newMappings);
                    }}
                    platePrimers={definition.platePrimers}
                    platePrimer={platePrimers && label && platePrimers[label]}
                    setPlatePrimer={primer => {
                        if (label && primer) {
                            const newPrimers = { ...platePrimers };
                            newPrimers[label] = primer;
                            setPlatePrimers(newPrimers);
                        }
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
    return <>
        <h4 className="row">{definition.name}</h4>
        <Table>
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
    </>
}

function RunBlockPlateAddReagentEditor({ disabled, definition, plateLabel, setPlateLabel, plateLot, setPlateLot }: {
    disabled?: boolean;
    definition: PlateAddReagentBlockDefinition;
    plateLabel?: string;
    plateLot?: string;
    setPlateLabel: (plateLabel?: string) => void;
    setPlateLot: (plateLot?: string) => void;
}) {
    return <>
        <h4 className="row">{definition.name}</h4>
        {
            definition.formula && <div className="row">
                <div className="col-8 mx-auto my-4">
                    <Calculator
                        disabled={disabled}
                        formula={definition.formula}
                        variables={definition.variables}
                    />
                </div>
            </div>
        }
        <div className="row">
            <Form.Group className="col">
                <Form.Label>Adding reagent ({definition.reagentLabel}) to plate</Form.Label>
                <RunBlockPlateLabelEditor
                    disabled={disabled}
                    wells={definition.plateSize}
                    label={plateLabel}
                    setLabel={setPlateLabel}
                />
            </Form.Group>
            <Form.Group className="col">
                <Form.Label>Reagent lot number</Form.Label>
                <RunBlockPlateLotEditor
                    disabled={disabled}
                    lot={plateLot}
                    setLot={setPlateLot}
                />
            </Form.Group>
        </div>
    </>;
}

function RunBlockPlateSequencerEditor({ disabled, definition, plateLabels, setPlateLabels, results, setResults, timestampLabel, setTimestampLabel, startedOn, setStartedOn }: {
    disabled?: boolean;
    definition: PlateSequencerBlockDefinition;
    plateLabels?: string[];
    setPlateLabels: (plateLabels?: string[]) => void;
    results?: PlateResult[];
    setResults: (results?: PlateResult[]) => void;
    timestampLabel?: string;
    setTimestampLabel: (timestampLabel?: string) => void;
    startedOn?: string;
    setStartedOn: (startedOn?: string) => void;
}) {
    const inputRows: JSX.Element[] = [];
    for (let i = 0; i < (definition.plateCount || 0); i++) {
        inputRows.push(<tr key={i}>
            <th>Input Plate {i}</th>
            <td>
                <RunBlockPlateLabelEditor
                    disabled={disabled}
                    wells={384}
                    name={definition.plates && definition.plates[i] && definition.plates[i].name}
                    label={plateLabels ? plateLabels[i] : undefined}
                    setLabel={label => {
                        if (label !== undefined) {
                            const newPlateLabels = cloneArrayToSize(definition.plateCount || 0, '', plateLabels);
                            newPlateLabels[i] = label;
                            setPlateLabels(newPlateLabels);
                        }
                    }}
                />
            </td>
        </tr>);
    }
    return <>
        <h4 className="row">{definition.name}</h4>
        <Table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Plate Label</th>
                </tr>
            </thead>
            <tbody>
                {inputRows}
            </tbody>
        </Table>
        <Form.Group className="col">
            <Form.Label>Timestamp ID/Label</Form.Label>
            <Form.Control
                disabled={disabled}
                type="text"
                placeholder="Enter a label or ID here..."
                aria-placeholder="Enter a label or ID here..."
                value={timestampLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimestampLabel((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
        <Form.Group className="col">
            <Form.Label>Started On</Form.Label>
            <InputGroup>
                <DatePicker
                    selected={startedOn ? moment(startedOn).toDate() : undefined}
                    onChange={start => {
                        if (start && (start instanceof Date)) {
                            setStartedOn(moment(start).format());
                        }
                    }}
                    placeholderText="Click here to set a date/time..."
                    todayButton="Now"
                    showTimeSelect
                    dateFormat="Pp"
                    customInput={<Form.Control />}
                />
                <InputGroup.Append>
                    <Button variant="secondary" onClick={() => setStartedOn(moment().format())}>Now</Button>
                </InputGroup.Append>
            </InputGroup>
        </Form.Group>
        <RunBlockSequencerResultsUploader
            disabled={disabled}
            results={results}
            setResults={setResults}
        />
    </>
}

function RunBlockStartTimestampEditor({ disabled, definition, timestampLabel, setTimestampLabel, startedOn, setStartedOn }: {
    disabled?: boolean;
    definition: StartTimestampBlockDefinition;
    timestampLabel?: string;
    setTimestampLabel: (timestampLabel?: string) => void;
    startedOn?: string;
    setStartedOn: (startedOn?: string) => void;
}) {
    return <>
        <RunBlockLabel name={definition.name} />
        <div className="row">
            <Form.Group className="col">
                <Form.Label>Timestamp ID/Label</Form.Label>
                <Form.Control
                    disabled={disabled}
                    type="text"
                    placeholder="Enter a label or ID here..."
                    aria-placeholder="Enter a label or ID here..."
                    value={timestampLabel}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimestampLabel((e.target as HTMLInputElement).value)}
                />
            </Form.Group>
            <Form.Group className="col">
                <Form.Label>Started On</Form.Label>
                <InputGroup>
                    <DatePicker
                        selected={startedOn ? moment(startedOn).toDate() : undefined}
                        onChange={start => {
                            if (start && (start instanceof Date)) {
                                setStartedOn(moment(start).format());
                            }
                        }}
                        placeholderText="Click here to set a date/time..."
                        todayButton="Now"
                        showTimeSelect
                        dateFormat="Pp"
                        customInput={<Form.Control />}
                    />
                    <InputGroup.Append>
                        <Button variant="secondary" onClick={() => setStartedOn(moment().format())}>Now</Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>
        </div>
    </>;
}

function RunBlockEndTimestampEditor({ disabled, definition, timestampLabel, setTimestampLabel, endedOn, setEndedOn }: {
    disabled?: boolean;
    definition: EndTimestampBlockDefinition;
    timestampLabel?: string;
    setTimestampLabel: (timestampLabel?: string) => void;
    endedOn?: string;
    setEndedOn: (startedOn?: string) => void;
}) {
    return <>
        <RunBlockLabel name={definition.name} />
        <div className="row">
            <Form.Group className="col">
                <Form.Label>Timestamp ID/Label</Form.Label>
                <Form.Control
                    disabled={disabled}
                    type="text"
                    placeholder="Enter a label or ID here..."
                    aria-placeholder="Enter a label or ID here..."
                    value={timestampLabel}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimestampLabel((e.target as HTMLInputElement).value)}
                />
            </Form.Group>
            <Form.Group className="col">
                <Form.Label>Ended On</Form.Label>
                <InputGroup>
                    <DatePicker
                        selected={endedOn ? moment(endedOn).toDate() : undefined}
                        onChange={start => {
                            if (start && (start instanceof Date)) {
                                setEndedOn(moment(start).format());
                            }
                        }}
                        placeholderText="Click here to set a date/time..."
                        todayButton="Now"
                        showTimeSelect
                        dateFormat="Pp"
                        customInput={<Form.Control />}
                    />
                    <InputGroup.Append>
                        <Button variant="secondary" onClick={() => setEndedOn(moment().format())}>Now</Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>
        </div>
    </>;
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
                    setMappings={plateMappings => props.setBlock({ ...block, type: 'plate-sampler', plateMappings })}
                    platePrimers={props.block && props.block.platePrimers}
                    setPlatePrimers={platePrimers => props.setBlock({ ...block, type: 'plate-sampler', platePrimers })}
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
                    plateLot={block.plateLot}
                    setPlateLabel={plateLabel => props.setBlock({ ...block, type: 'plate-add-reagent', plateLabel })}
                    setPlateLot={plateLot => props.setBlock({ ...block, type: 'plate-add-reagent', plateLot })}
                />
            );
        }
        case 'plate-sequencer': {
            const block: PlateSequencerBlock = props.block;
            return (
                <RunBlockPlateSequencerEditor
                    disabled={props.disabled}
                    definition={block.definition}
                    plateLabels={block.plateLabels}
                    setPlateLabels={plateLabels => props.setBlock({ ...block, type: 'plate-sequencer', plateLabels })}
                    results={props.block && props.block.plateSequencingResults}
                    setResults={plateSequencingResults => props.setBlock({ ...block, type: 'plate-sequencer', plateSequencingResults })}
                    timestampLabel={block.timestampLabel}
                    setTimestampLabel={timestampLabel => props.setBlock({ ...block, type: 'plate-sequencer', timestampLabel })}
                    startedOn={block.startedOn}
                    setStartedOn={startedOn => props.setBlock({ ...block, type: 'plate-sequencer', startedOn })}
                />
            );
        }
        case 'start-timestamp': {
            const block: StartTimestampBlock = props.block;
            return (
                <RunBlockStartTimestampEditor
                    disabled={props.disabled}
                    definition={block.definition}
                    timestampLabel={block.timestampLabel}
                    setTimestampLabel={timestampLabel => props.setBlock({ ...block, type: 'start-timestamp', timestampLabel })}
                    startedOn={block.startedOn}
                    setStartedOn={startedOn => props.setBlock({ ...block, type: 'start-timestamp', startedOn })}
                />
            );
        }
        case 'end-timestamp': {
            const block: EndTimestampBlock = props.block;
            return (
                <RunBlockEndTimestampEditor
                    disabled={props.disabled}
                    definition={block.definition}
                    timestampLabel={block.timestampLabel}
                    setTimestampLabel={timestampLabel => props.setBlock({ ...block, type: 'end-timestamp', timestampLabel })}
                    endedOn={block.endedOn}
                    setEndedOn={endedOn => props.setBlock({ ...block, type: 'end-timestamp', endedOn })}
                />
            );
        }
        default:
            return (
                <div>
                    Unrecognized block type: {(props.block as any).type}
                </div>
            );
    }
}
