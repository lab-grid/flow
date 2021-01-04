import React, { useState } from 'react';
import { Button, Dropdown, DropdownButton, Form, FormControl, InputGroup } from 'react-bootstrap';
import { GripHorizontal, Trash } from 'react-bootstrap-icons';
import { BlockDefinition, BlockOption, BlockPlate, BlockPlateMarkerEntry, BlockPrimer, BlockVariable, CalculatorBlockDefinition, EndTimestampBlockDefinition, OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, EndPlateSequencerBlockDefinition, StartTimestampBlockDefinition, TextQuestionBlockDefinition, StartPlateSequencerBlockDefinition } from '../models/block-definition';
import { trimEmpty } from '../utils';
import * as uuid from 'uuid';
import { TableUploadModal } from './TableUploadModal';

export function humanizeBlockType(blockType: "text-question" | "options-question" | "calculator" | "plate-sampler" | "plate-add-reagent" | "start-timestamp" | "end-timestamp" | "start-plate-sequencer" | "end-plate-sequencer" | undefined): string {
    switch (blockType) {
        case 'text-question':
            return 'Answer Question';
        case 'options-question':
            return 'Answer Multiple Choice Question';
        case 'calculator':
            return 'Calculation';
        case 'plate-sampler':
            return 'Run Plate Sampler';
        case 'plate-add-reagent':
            return 'Add Reagent to Plate';
        case 'start-timestamp':
            return 'Start Timestamp';
        case 'end-timestamp':
            return 'End Timestamp';
        case 'start-plate-sequencer':
            return 'Start Plate Sequencer';
        case 'end-plate-sequencer':
            return 'End Plate Sequencer';
        default:
            return `Error: Unrecognized block type: ${blockType}`;
    }
}

function BlockLabel({ index, blockType }: {
    index: number;
    blockType?: "text-question" | "options-question" | "calculator" | "plate-sampler" | "plate-add-reagent" | "start-timestamp" | "end-timestamp" | "start-plate-sequencer" | "end-plate-sequencer";
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
                    value={name || ""}
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
    return <Form.Group>
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
    </Form.Group>
}

function ProtocolBlockOptionEditor({ disabled, deletable, placeholder, option, setOption, deleteOption }: {
    disabled?: boolean;
    deletable?: boolean;
    placeholder?: string;
    option?: string;
    setOption: (option: string | undefined) => void;
    deleteOption: () => void;
}) {
    return<InputGroup>
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

function ProtocolBlockPrimersEditor({ disabled, primers, setPrimers }: {
    disabled?: boolean;
    primers?: BlockPrimer[];
    setPrimers: (primers?: BlockPrimer[]) => void;
}) {
    const currentPrimers = trimEmpty(primers, primer => primer.primer);
    currentPrimers.push({ id: uuid.v4(), primer: "" });
    return <Form.Group>
        <Form.Label>
            Primers
        </Form.Label>
        {currentPrimers.map((primer, i) => <ProtocolBlockPrimerEditor
            disabled={disabled}
            deletable={currentPrimers.length - 1 !== i}
            key={primer.id}
            primer={primer.primer}
            setPrimer={primer => {
                const newPrimers = [...currentPrimers];
                newPrimers[i].primer = primer || "";
                setPrimers(newPrimers);
            }}
            deletePrimer={() => {
                const newPrimers = [...currentPrimers];
                newPrimers.splice(i, 1);
                setPrimers(newPrimers);
            }}
            placeholder={(currentPrimers.length - 1 === i) ? "Start typing here to add an primer..." : "Blank primer (will be ignored)"}
        />)}
    </Form.Group>
}

function ProtocolBlockPrimerEditor({ disabled, deletable, placeholder, primer, setPrimer, deletePrimer }: {
    disabled?: boolean;
    deletable?: boolean;
    placeholder?: string;
    primer?: string;
    setPrimer: (primer: string | undefined) => void;
    deletePrimer: () => void;
}) {
    return <InputGroup>
        <FormControl
            disabled={disabled}
            placeholder={placeholder}
            value={primer}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrimer((e.target as HTMLInputElement).value)}
        />
        {!disabled && deletable &&
            <InputGroup.Append>
                <Button variant="secondary" onClick={deletePrimer}><Trash /></Button>
            </InputGroup.Append>
        }
    </InputGroup>
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
    return <InputGroup>
        <DropdownButton
            disabled={disabled}
            as={InputGroup.Prepend}
            variant="outline-secondary"
            title={`${plateSize || (plateSizes && plateSizes[0])}-well`}
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
}

function ProtocolBlockPlatesEditor<T extends number = number>({ disabled, label, plateSizes, plates, setPlates }: {
    disabled?: boolean;
    label?: string;
    plateSizes?: T[];
    plates?: BlockPlate<T>[];
    setPlates: (plates?: BlockPlate<T>[]) => void;
}) {
    return <Form.Group>
        {label && <Form.Label>{label}</Form.Label>}
        {plates && plates.map((plate, i) => {
            const currentPlate = plate || { id: uuid.v4() };
            return <ProtocolBlockPlateEditor
                key={currentPlate.id}
                disabled={disabled}
                plateName={currentPlate.name}
                plateSize={currentPlate.size}
                plateSizes={plateSizes}
                setPlateName={name => {
                    if (plates) {
                        const newPlates = [...plates];
                        newPlates[i] = currentPlate;
                        newPlates[i].name = name;
                        setPlates(newPlates);
                    }
                }}
                setPlateSize={size => {
                    if (plates) {
                        const newPlates = [...plates];
                        newPlates[i] = currentPlate;
                        newPlates[i].size = size;
                        setPlates(newPlates);
                    }
                }}
            />
        })}
    </Form.Group>
}

function ProtocolBlockPlateCountEditor({ disabled, label, plateCount, setPlateCount }: {
    disabled?: boolean;
    label?: string;
    plateCount?: number;
    setPlateCount: (plateCount?: number) => void;
}) {
    return <Form.Group>
        <Form.Label>{label}</Form.Label>
        <Form.Control
            disabled={disabled}
            type="number"
            placeholder="Enter a number: 4"
            value={plateCount || ""}
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

function ProtocolBlockVariablesEditor({ disabled, variables, setVariables }: {
    disabled?: boolean;
    variables?: BlockVariable[];
    setVariables: (variables?: BlockVariable[]) => void;
}) {
    const currentVariables = trimEmpty(variables, variable => variable.name);
    currentVariables.push({ id: uuid.v4(), name: "" });
    return <>
        {currentVariables.map((variable, i) => <ProtocolBlockVariableEditor
            disabled={disabled}
            deletable={currentVariables.length - 1 !== i}
            key={variable.id}
            variable={variable.name}
            setVariable={variable => {
                const newVariables = [...currentVariables];
                newVariables[i].name = variable || "";
                setVariables(newVariables);
            }}
            setDefaultValue={defaultValue => {
                const newVariables = [...currentVariables];
                newVariables[i].defaultValue = defaultValue;
                setVariables(newVariables);
            }}
            deleteVariable={() => {
                const newVariables = [...currentVariables];
                newVariables.splice(i, 1);
                setVariables(newVariables);
            }}
            placeholder={(currentVariables.length - 1 === i) ? "Start typing here to add an variable..." : "Blank variable (will be ignored)"}
        />)}
    </>
}

function ProtocolBlockVariableEditor({ disabled, deletable, placeholder, variable, defaultValue, setVariable, setDefaultValue, deleteVariable }: {
    disabled?: boolean;
    deletable?: boolean;
    placeholder?: string;
    variable?: string;
    defaultValue?: number;
    setVariable: (variable: string | undefined) => void;
    setDefaultValue: (d?: number) => void;
    deleteVariable: () => void;
}) {
    return <Form.Group>
        <InputGroup>
            <FormControl
                disabled={disabled}
                placeholder={placeholder}
                value={variable}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVariable((e.target as HTMLInputElement).value)}
            />
            {deletable &&
                <FormControl
                    style={{
                        'maxWidth': '240px',
                    }}
                    type="number"
                    disabled={disabled}
                    placeholder="Default value"
                    value={defaultValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDefaultValue(parseInt((e.target as HTMLInputElement).value))}
                />
            }
            {!disabled && deletable &&
                <InputGroup.Append>
                    <Button variant="secondary" onClick={deleteVariable}><Trash /></Button>
                </InputGroup.Append>
            }
        </InputGroup>
    </Form.Group>
}

function ProtocolBlockFormulaEditor({ disabled, formula, setFormula, variables, setVariables }: {
    disabled?: boolean;
    formula?: string;
    setFormula: (formula?: string) => void;
    variables?: BlockVariable[];
    setVariables: (variables?: BlockVariable[]) => void;
}) {
    return <>
        <Form.Group>
            <Form.Label>Formula (<a href="https://mathjs.org/docs/expressions/syntax.html">Syntax</a>)</Form.Label>
            <Form.Control
                disabled={disabled}
                type="text"
                placeholder="Enter a formula. Leave blank to omit"
                value={formula}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormula((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
        <Form.Group>
            <Form.Label>Formula Variables</Form.Label>
            <ProtocolBlockVariablesEditor
                disabled={disabled}
                variables={variables}
                setVariables={setVariables}
            />
        </Form.Group>
    </>
}

function ProtocolBlockMarkersUploader({ disabled, plateMarkers, setPlateMarkers }: {
    disabled?: boolean;
    plateMarkers?: {[markers: string]: BlockPlateMarkerEntry};
    setPlateMarkers: (plateMarkers?: {[markers: string]: BlockPlateMarkerEntry}) => void;
}) {
    const [showUploader, setShowUploader] = useState(false);

    const markersCount = plateMarkers && Object.keys(plateMarkers).length;

    const parseAndSetMarkers = (data: BlockPlateMarkerEntry[]) => {
        const results: { [marker: string]: BlockPlateMarkerEntry } = {};
        for (const row of data) {
            if (!row.marker1 && !row.marker2) {
                console.warn('Found a row with no markers!', row);
                return;
            }
            results[`${row.marker1}${row.marker2}`] = row;
        }
        const labels = Object.keys(results);
        if (labels.length === 0) {
            console.warn('Uploaded table contained no data', data, results);
            return;
        }
        setPlateMarkers(results);
        setShowUploader(false);
    }

    return <Form.Group>
        <Form.Label>
            Plate Markers
        </Form.Label>
        <TableUploadModal
            parseHeader={true}
            columns={{
                'marker1': 'index',
                'marker2': 'index2',
                'plateIndex': 'plate_384',
                'plateRow': 'row_384',
                'plateColumn': 'column_384',
            }}
            show={showUploader}
            setShow={setShowUploader}
            setTable={parseAndSetMarkers}
        />
        <InputGroup>
            <Form.Control
                disabled={true}
                placeholder={markersCount ? `${markersCount} markers saved...` : "Upload markers plate mapping csv"}
                aria-label={markersCount ? `${markersCount} markers saved...` : "Upload markers plate mapping csv"}
            />
            <InputGroup.Append>
                <Button variant="secondary" disabled={disabled} onClick={() => setShowUploader(true)}>
                    Upload
                </Button>
            </InputGroup.Append>
        </InputGroup>
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
        case 'calculator': {
            const block: CalculatorBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'calculator', name })}
                    deleteStep={props.deleteBlock}
                />
                <ProtocolBlockFormulaEditor
                    disabled={props.disabled}
                    formula={block.formula}
                    setFormula={formula => props.setBlock({ ...block, type: 'calculator', formula })}
                    variables={block.variables}
                    setVariables={variables => props.setBlock({ ...block, type: 'calculator', variables })}
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
                <ProtocolBlockPlatesEditor
                    disabled={props.disabled}
                    label="Plate to sample"
                    plateSizes={[96]}
                    plates={block.plates}
                    setPlates={plates => props.setBlock({ ...block, type: 'plate-sampler', plates })}
                />
                <ProtocolBlockPlateCountEditor
                    disabled={props.disabled}
                    label="Number of plates to transfer"
                    plateCount={block.plateCount}
                    setPlateCount={plateCount => {
                        let plates = block.plates;
                        if (!plates) {
                            plates = Array(plateCount || 0);
                            for (let i = 0; i < (plateCount || 0); i++) {
                                plates[i] = {id: uuid.v4()};
                            }
                        }
                        if (plates.length !== plateCount) {
                            const newPlates: BlockPlate[] = [];
                            for (let i = 0; i < (plateCount || 0); i++) {
                                newPlates.push(plates[i] || {id: uuid.v4()});
                            }
                            plates = newPlates;
                        }
                        props.setBlock({ ...block, type: 'plate-sampler', plateCount, plates });
                    }}
                />
                <ProtocolBlockPrimersEditor
                    disabled={props.disabled}
                    primers={block.platePrimers}
                    setPrimers={platePrimers => props.setBlock({ ...block, type: 'plate-sampler', platePrimers })}
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
                <ProtocolBlockFormulaEditor
                    disabled={props.disabled}
                    formula={block.formula}
                    setFormula={formula => props.setBlock({ ...block, type: 'plate-add-reagent', formula })}
                    variables={block.variables}
                    setVariables={variables => props.setBlock({ ...block, type: 'plate-add-reagent', variables })}
                />
            </>;
        }
        case 'start-plate-sequencer': {
            const block: StartPlateSequencerBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'start-plate-sequencer', name })}
                    deleteStep={props.deleteBlock}
                />
                <ProtocolBlockPlatesEditor
                    disabled={props.disabled}
                    label="Plate to sequence"
                    plateSizes={[384]}
                    plates={block.plates}
                    setPlates={plates => props.setBlock({ ...block, type: 'start-plate-sequencer', plates })}
                />
                <ProtocolBlockPlateCountEditor
                    disabled={props.disabled}
                    label="Number of plates to sequence"
                    plateCount={block.plateCount}
                    setPlateCount={plateCount => {
                        let plates = block.plates;
                        if (!plates) {
                            plates = Array(plateCount || 0);
                            for (let i = 0; i < (plateCount || 0); i++) {
                                plates[i] = {id: uuid.v4()};
                            }
                        }
                        if (plates.length !== plateCount) {
                            const newPlates: BlockPlate[] = [];
                            for (let i = 0; i < (plateCount || 0); i++) {
                                newPlates.push(plates[i] || {id: uuid.v4()});
                            }
                            plates = newPlates;
                        }
                        props.setBlock({ ...block, type: 'start-plate-sequencer', plateCount, plates });
                    }}
                />
            </>;
        }
        case 'end-plate-sequencer': {
            const block: EndPlateSequencerBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'end-plate-sequencer', name })}
                    deleteStep={props.deleteBlock}
                />
                <ProtocolBlockMarkersUploader
                    disabled={props.disabled}
                    plateMarkers={block.plateMarkers}
                    setPlateMarkers={plateMarkers => props.setBlock({ ...block, type: 'end-plate-sequencer', plateMarkers })}
                />
            </>;
        }
        case 'start-timestamp': {
            const block: StartTimestampBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'start-timestamp', name })}
                    deleteStep={props.deleteBlock}
                />
            </>;
        }
        case 'end-timestamp': {
            const block: EndTimestampBlockDefinition = props.block;
            return <>
                <BlockLabel index={props.index} blockType={block.type} />
                <ProtocolBlockNameEditor
                    disabled={props.disabled}
                    name={block.name}
                    setName={name => props.setBlock({ ...block, type: 'end-timestamp', name })}
                    deleteStep={props.deleteBlock}
                />
            </>;
        }
        default:
            return (
                <div>
                    Unrecognized block type: {(props.block as any).type} <Button variant="danger" onClick={props.deleteBlock}>Delete</Button>
                </div>
            );
    }
}
