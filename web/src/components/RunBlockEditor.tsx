import moment from 'moment';
import React, { useState } from 'react';
import { Button, Dropdown, DropdownButton, Form, FormControl, InputGroup, Table } from 'react-bootstrap';
import { Trash, UpcScan } from 'react-bootstrap-icons';
import { TextQuestionBlock, OptionsQuestionBlock, PlateSamplerBlock, PlateAddReagentBlock, EndPlateSequencerBlock, Block, StartTimestampBlock, EndTimestampBlock, CalculatorBlock, StartPlateSequencerBlock, BlockAttachment, AddReagentBlock } from '../models/block';
import { BlockPrimer, CalculatorBlockDefinition, EndTimestampBlockDefinition, OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, EndPlateSequencerBlockDefinition, StartTimestampBlockDefinition, TextQuestionBlockDefinition, StartPlateSequencerBlockDefinition, AddReagentBlockDefinition } from '../models/block-definition';
import { TableUploadModal } from './TableUploadModal';
import { Calculator } from './Calculator';
import DatePicker from "react-datepicker";
import { deleteRunAttachment, downloadRunAttachment, uploadRunAttachment, uploadRunAttachmentBlob } from '../state/api';
import { useRecoilCallback } from 'recoil';
import { auth0State } from '../state/atoms';
import { Attachment } from '../models/attachment';
import { TableImportModal } from './TableImportModal';
import { PlateCoordinate } from '../models/plate-coordinate';
import { PlateResult } from '../models/plate-result';

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

function RunBlockCalculatorEditor({ disabled, definition, values, setValues }: {
    disabled?: boolean;
    definition: CalculatorBlockDefinition;
    values?: {[variable: string]: number};
    setValues: (values?: {[variable: string]: number}) => void;
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
                        values={values}
                        setValues={setValues}
                    />
                </div>
            </div>
        }
    </>;
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

function cellToRowCol(cell: string): [number, number] | undefined {
    const cellMatchGroups = cell.match(cellRegex);
    if (!cellMatchGroups) {
        return undefined;
    }

    const [, rowRaw, columnRaw] = cellMatchGroups;

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

    const coordinates = cellToRowCol(cell);
    if (!coordinates) {
        return {};
    }

    const [row, col] = coordinates;
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
            coordinate.sampleLabel = `${row.sample}`;
            // coordinate.sampleLabel = typeof row.sample === 'string' ? undefined : row.sample;
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
            {
                platePrimers && platePrimers.length && <DropdownButton
                    as={InputGroup.Prepend}
                    disabled={disabled}
                    variant="outline-secondary"
                    title={platePrimer ? `Primer: ${platePrimer}` : 'Select Primer'}
                >
                    {platePrimers && platePrimers.map(primer =>
                        <Dropdown.Item key={primer.id} onClick={() => setPlatePrimer(primer.primer)}>{primer.primer}</Dropdown.Item>
                    )}
                </DropdownButton>
            }
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

function filenameToMime(filename: string): string | undefined {
    const fileExtRegex = /\.[0-9a-z]+$/i;
    const matches = filename.match(fileExtRegex);
    const extension = matches && matches[0];
    switch (extension) {
        case '.csv':
            return 'text/csv';
        case '.pdf':
            return 'application/pdf';
        default:
            return undefined;
    }
}

async function b64toBlob(base64: string, type = 'application/octet-stream'): Promise<Blob> {
    const response = await fetch(`data:${type};base64,${base64}`)
    return response.blob();
}

interface sequencerRow {
    plateLabel?: string;
    plateIndex?: number;
    plateCell?: string;
    marker1?: number;
    marker2?: number;
    classification?: string;
}

function RunBlockSequencerResultsUploader({ disabled, runId, fileData, importUrl, importMethod, importParams, results, setResults, setFileData }: {
    disabled?: boolean;
    runId: number;
    fileData?: BlockAttachment;
    importUrl?: string;
    importMethod?: string;
    importParams?: string[];
    results?: PlateResult[];
    setResults: (results?: PlateResult[]) => void;
    setFileData: (fileData?: BlockAttachment) => void;
}) {
    const [showUploader, setShowUploader] = useState(false);
    const [showImporter, setShowImporter] = useState(false);

    const parseAndSetResults = (data: sequencerRow[]) => {
        const results: PlateResult[] = [];
        for (const row of data) {
            const {plateCell, ...withoutCell} = row;
            if (!plateCell) {
                console.warn('Found a row without a cell!', row);
                return;
            }
            const coordinates = cellToRowCol(plateCell);
            if (coordinates) {
                const [plateRow, plateCol] = coordinates;
                results.push({
                    ...withoutCell,
                    plateRow,
                    plateCol,
                });
            } else {
                results.push(withoutCell);
            }
        }
        if (results.length === 0) {
            console.warn('Uploaded table contained no data', data, results);
            return;
        }
        setResults(results);
        setShowUploader(false);
    }

    const importResults = useRecoilCallback(({ snapshot }) => async (data: PlateResult[], attachments: {[filename: string]: string}) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        const result: BlockAttachment = fileData ? {...fileData} : {};
        const resultPromises: Promise<Attachment>[] = [];
        for (const [filename, b64File] of Object.entries(attachments)) {
            const mime = filenameToMime(filename);
            const blob = mime ? await b64toBlob(b64File, mime) : await b64toBlob(b64File);
            if (blob) {
                resultPromises.push(uploadRunAttachmentBlob(() => auth0Client, runId, filename, blob));
            }
        }
        const results = await Promise.all(resultPromises);
        for (const attachment of results) {
            if (attachment.id) {
                result[attachment.id] = attachment.name || "";
            }
        }
        setResults(data);
        setFileData(result);
        setShowImporter(false);
    });

    return <>
        <TableUploadModal
            parseHeader={true}
            columns={{
                'plateLabel': 'PlateBarcode',
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
        <TableImportModal
            url={importUrl || ''}
            method={importMethod || ''}
            params={importParams || []}
            show={showImporter}
            setShow={setShowImporter}
            setTable={importResults}
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
                <Button variant="secondary" disabled={disabled} onClick={() => setShowImporter(true)}>
                    Import
                </Button>
            </InputGroup.Append>
        </InputGroup>
    </>
}

function RunBlockFileUploader({ disabled, runId, label, fileData, setFileData }: {
    disabled?: boolean;
    runId: number;
    label?: string;
    fileData?: BlockAttachment;
    setFileData: (fileData?: BlockAttachment) => void;
}) {
    const uploadFile = useRecoilCallback(({ snapshot }) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {
            return;
        }
        const files = [...e.target.files];
        const result: BlockAttachment = fileData ? {...fileData} : {};
        const { auth0Client } = await snapshot.getPromise(auth0State);
        const resultPromises: Promise<Attachment>[] = [];
        for (const file of files) {
            if (file) {
                resultPromises.push(uploadRunAttachment(() => auth0Client, runId, file));
            }
        }
        const results = await Promise.all(resultPromises);
        for (const attachment of results) {
            if (attachment.id) {
                result[attachment.id] = attachment.name || "";
            }
        }
        setFileData(result);
    });
    const deleteFile = useRecoilCallback(({ snapshot }) => async (id: string) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        await deleteRunAttachment(() => auth0Client, runId, id);
        const newFileData = {...fileData};
        delete newFileData[id];
        setFileData(newFileData);
    });
    const downloadFile = useRecoilCallback(({ snapshot }) => async (id: string, filename: string) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        await downloadRunAttachment(() => auth0Client, runId, id, filename);
    });

    return <Form.Group>
        <Form.Label>{label}</Form.Label>
        <Form.File
            disabled={disabled}
            label={fileData ? "File saved. Upload new file(s)" : "Upload new file(s)"}
            onChange={uploadFile}
        />
        {Object.entries(fileData || {}).map(([attachmentId, filename]) =>
            <div className="d-flex" key={attachmentId}>
                <Button
                    className="mr-auto my-auto"
                    variant="link"
                    onClick={() => downloadFile(attachmentId, filename)}
                >
                    {filename}
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => deleteFile(attachmentId)}><Trash /></Button>
            </div>
        )}
    </Form.Group>
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
    const plateIds = definition.plates && definition.plates.filter(plate => !!plate).map(plate => plate.id);
    const inputRows: JSX.Element[] = [];
    for (let i = 0; i < (definition.plateCount || 0); i++) {
        const label = plates && plates[i];
        const id = plateIds && plateIds[i];
        inputRows.push(<tr key={i}>
            <th>Input Plate {i+1} <img alt={`Quadrant ${i}`} src={"../images/quadrant_" + i + ".png"} width="75"/> </th>
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
                    platePrimer={platePrimers && id && platePrimers[id]}
                    setPlatePrimer={primer => {
                        if (id && primer) {
                            const newPrimers = { ...platePrimers };
                            newPrimers[id] = primer;
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
                    <th> </th>
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

function RunBlockPlateAddReagentEditor({ disabled, definition, plateLabel, setPlateLabel, plateLot, setPlateLot, values, setValues }: {
    disabled?: boolean;
    definition: PlateAddReagentBlockDefinition;
    values?: {[variable: string]: number};
    plateLabel?: string;
    plateLot?: string;
    setValues: (values?: {[variable: string]: number}) => void;
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
                        values={values}
                        setValues={setValues}
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

function RunBlockAddReagentEditor({ disabled, definition, reagentLot, setReagentLot, values, setValues }: {
    disabled?: boolean;
    definition: AddReagentBlockDefinition;
    values?: {[variable: string]: number};
    reagentLot?: string;
    setValues: (values?: {[variable: string]: number}) => void;
    setReagentLot: (plateLot?: string) => void;
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
                        values={values}
                        setValues={setValues}
                    />
                </div>
            </div>
        }
        <div className="row">
            <Form.Group className="col">
                <Form.Label>Reagent lot number</Form.Label>
                <RunBlockPlateLotEditor
                    disabled={disabled}
                    lot={reagentLot}
                    setLot={setReagentLot}
                />
            </Form.Group>
        </div>
    </>;
}

function RunBlockStartPlateSequencerEditor({ disabled, definition, plateLabels, setPlateLabels, timestampLabel, setTimestampLabel, startedOn, setStartedOn }: {
    disabled?: boolean;
    definition: StartPlateSequencerBlockDefinition;
    plateLabels?: string[];
    setPlateLabels: (plateLabels?: string[]) => void;
    timestampLabel?: string;
    setTimestampLabel: (timestampLabel?: string) => void;
    startedOn?: string;
    setStartedOn: (startedOn?: string) => void;
}) {
    const inputRows: JSX.Element[] = [];
    for (let i = 0; i < (definition.plateCount || 0); i++) {
        inputRows.push(<tr key={i}>
            <th>Input Plate {i} </th>
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
    </>
}

function RunBlockEndPlateSequencerEditor({ disabled, runId, definition, attachments, syncAttachments, results, setResults, timestampLabel, setTimestampLabel, endedOn, setEndedOn }: {
    disabled?: boolean;
    runId: number;
    definition: EndPlateSequencerBlockDefinition;
    attachments?: BlockAttachment;
    syncAttachments: (attachment?: BlockAttachment) => void;
    results?: PlateResult[];
    setResults: (results?: PlateResult[]) => void;
    timestampLabel?: string;
    setTimestampLabel: (timestampLabel?: string) => void;
    endedOn?: string;
    setEndedOn: (startedOn?: string) => void;
}) {
    return <>
        <h4 className="row">{definition.name}</h4>
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
        <RunBlockSequencerResultsUploader
            disabled={disabled}
            runId={runId}
            results={results}
            setResults={setResults}
            fileData={attachments}
            setFileData={syncAttachments}
            importUrl={definition.importerUrl}
            importMethod={definition.importerMethod}
            importParams={definition.importerParams && definition.importerParams.map(p => p.param)}
        />
        <RunBlockFileUploader
            label="Analysis data"
            disabled={disabled}
            runId={runId}
            fileData={attachments}
            setFileData={syncAttachments}
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
    runId: number;
    block?: Block;
    setBlock: (block?: Block) => void;
    syncBlock: (block?: Block) => void;
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
        case 'calculator': {
            const block: CalculatorBlock = props.block;
            return (
                <RunBlockCalculatorEditor
                    disabled={props.disabled}
                    definition={block.definition}
                    values={block.values}
                    setValues={values => props.setBlock({ ...block, type: 'calculator', values })}
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
                    values={block.values}
                    setValues={values => props.setBlock({ ...block, type: 'plate-add-reagent', values })}
                />
            );
        }
        case 'add-reagent': {
            const block: AddReagentBlock = props.block;
            return (
                <RunBlockAddReagentEditor
                    disabled={props.disabled}
                    definition={block.definition}
                    reagentLot={block.reagentLot}
                    setReagentLot={reagentLot => props.setBlock({ ...block, type: 'add-reagent', reagentLot })}
                    values={block.values}
                    setValues={values => props.setBlock({ ...block, type: 'add-reagent', values })}
                />
            );
        }
        case 'start-plate-sequencer': {
            const block: StartPlateSequencerBlock = props.block;
            return (
                <RunBlockStartPlateSequencerEditor
                    disabled={props.disabled}
                    definition={block.definition}
                    plateLabels={block.plateLabels}
                    setPlateLabels={plateLabels => props.setBlock({ ...block, type: 'start-plate-sequencer', plateLabels })}
                    timestampLabel={block.timestampLabel}
                    setTimestampLabel={timestampLabel => props.setBlock({ ...block, type: 'start-plate-sequencer', timestampLabel })}
                    startedOn={block.startedOn}
                    setStartedOn={startedOn => props.setBlock({ ...block, type: 'start-plate-sequencer', startedOn })}
                />
            );
        }
        case 'end-plate-sequencer': {
            const block: EndPlateSequencerBlock = props.block;
            return (
                <RunBlockEndPlateSequencerEditor
                    disabled={props.disabled}
                    runId={props.runId}
                    definition={block.definition}
                    attachments={props.block && props.block.attachments}
                    syncAttachments={attachment => props.syncBlock({ ...block, type: 'end-plate-sequencer', attachments: attachment })}
                    results={props.block && props.block.plateSequencingResults}
                    setResults={plateSequencingResults => props.setBlock({ ...block, type: 'end-plate-sequencer', plateSequencingResults })}
                    timestampLabel={block.timestampLabel}
                    setTimestampLabel={timestampLabel => props.setBlock({ ...block, type: 'end-plate-sequencer', timestampLabel })}
                    endedOn={block.endedOn}
                    setEndedOn={endedOn => props.setBlock({ ...block, type: 'end-plate-sequencer', endedOn })}
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
