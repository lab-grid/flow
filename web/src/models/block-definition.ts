export type BlockDefinition = TextQuestionBlockDefinition
    | OptionsQuestionBlockDefinition
    | CalculatorBlockDefinition
    | PlateSamplerBlockDefinition
    | PlateAddReagentBlockDefinition
    | AddReagentBlockDefinition
    | StartPlateSequencerBlockDefinition
    | EndPlateSequencerBlockDefinition
    | StartTimestampBlockDefinition
    | EndTimestampBlockDefinition;

export interface BlockOption {
    id: string;
    option: string;
}

export interface BlockPrimer {
    id: string;
    primer: string;
}

export interface BlockParam {
    id: string;
    param: string;
}

export interface BlockVariable {
    id: string;
    name: string;
    defaultValue?: number;
}

export interface BlockPlateMarkerEntry {
    marker1?: string;
    marker2?: string;
    plateIndex?: number;  // Reference to order in which the 384-well plates are sequenced (multiple are processed in batches).
    plateRow?: number;
    plateColumn?: number;
}

export interface BlockPlate<T extends number = number>{
    id: string;
    name?: string;
    size?: T;
}

export interface BlockResultsImport<T = any>{
    id?: string;
    status?: 'ready' | 'not-ready' | 'failed';
    error?: string;
    results?: T[];
    attachments?: {[filename: string]: string};
}

export interface TextQuestionBlockDefinition {
    type: 'text-question';

    id?: string;
    name?: string;
}

export interface OptionsQuestionBlockDefinition {
    type: 'options-question';

    id?: string;
    name?: string;
    optionType?: 'switch' | 'checkbox' | 'radio' | 'menu-item' | 'user';
    options?: BlockOption[];
}

export interface CalculatorBlockDefinition {
    type: 'calculator';

    id?: string;
    name?: string;

    formula?: string;
    variables?: BlockVariable[];
}

export interface PlateSamplerBlockDefinition {
    type: 'plate-sampler';

    id?: string;
    name?: string;
    plates?: BlockPlate[];
    plateCount?: number;
    platePrimers?: BlockPrimer[];
}

export interface PlateAddReagentBlockDefinition {
    type: 'plate-add-reagent';

    id?: string;
    name?: string;
    plateName?: string;
    plateSize?: 384 | 96;
    reagentLabel?: string;

    formula?: string;
    variables?: BlockVariable[];
}

export interface AddReagentBlockDefinition {
    type: 'add-reagent';

    id?: string;
    name?: string;
    reagentLabel?: string;

    formula?: string;
    variables?: BlockVariable[];
}

export interface StartTimestampBlockDefinition {
    type: 'start-timestamp';

    id?: string;
    name?: string;
}

export interface EndTimestampBlockDefinition {
    type: 'end-timestamp';

    id?: string;
    name?: string;
}

export interface StartPlateSequencerBlockDefinition {
    type: 'start-plate-sequencer';

    id?: string;
    name?: string;
    plates?: BlockPlate[];
    plateCount?: number;
}

export interface EndPlateSequencerBlockDefinition {
    type: 'end-plate-sequencer';

    id?: string;
    name?: string;
    plateMarkers?: {[markers: string]: BlockPlateMarkerEntry};

    importerType?: 'synchronous' | 'asynchronous';
    importerUrl?: string;
    importerCheckUrl?: string;
    importerMethod?: string;
    importerParams?: BlockParam[];
}
