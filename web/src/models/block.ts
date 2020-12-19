import { CalculatorBlockDefinition, EndTimestampBlockDefinition, OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, EndPlateSequencerBlockDefinition, StartTimestampBlockDefinition, TextQuestionBlockDefinition, StartPlateSequencerBlockDefinition } from "./block-definition";

export type Block = TextQuestionBlock
    | OptionsQuestionBlock
    | CalculatorBlock
    | PlateSamplerBlock
    | PlateAddReagentBlock
    | StartPlateSequencerBlock
    | EndPlateSequencerBlock
    | StartTimestampBlock
    | EndTimestampBlock;

export interface TextQuestionBlock {
    type: 'text-question';
    definition: TextQuestionBlockDefinition;

    answer?: string;
}

export interface OptionsQuestionBlock {
    type: 'options-question';
    definition: OptionsQuestionBlockDefinition;

    answer?: string;
}

export interface CalculatorBlock {
    type: 'calculator';
    definition: CalculatorBlockDefinition;

    values?: {[variable: string]: number};
}

export interface PlateSamplerBlock {
    type: 'plate-sampler';
    definition: PlateSamplerBlockDefinition;

    plateMappings?: {[label: string]: PlateCoordinate[]};
    platePrimers?: {[label: string]: string};

    outputPlateLabel?: string;
}

export interface PlateAddReagentBlock {
    type: 'plate-add-reagent';
    definition: PlateAddReagentBlockDefinition;

    plateLabel?: string;
    plateLot?: string;

    // TODO: Save input calculator variables.
    values?: {[variable: string]: number};
}

export interface StartTimestampBlock {
    type: 'start-timestamp';
    definition: StartTimestampBlockDefinition;

    timestampLabel?: string;
    startedOn?: string;
}

export interface EndTimestampBlock {
    type: 'end-timestamp';
    definition: EndTimestampBlockDefinition;

    timestampLabel?: string;
    endedOn?: string;
}

export interface StartPlateSequencerBlock {
    type: 'start-plate-sequencer';
    definition: StartPlateSequencerBlockDefinition;

    plateLabels?: string[];
    timestampLabel?: string;
    startedOn?: string;
}

export interface EndPlateSequencerBlock {
    type: 'end-plate-sequencer';
    definition: EndPlateSequencerBlockDefinition;

    plateSequencingResults?: PlateResult[];
    timestampLabel?: string;
    endedOn?: string;
}

export interface PlateResult {
    plateLabel?: string;
    plateIndex?: number;
    plateRow?: number;
    plateCol?: number;
    marker1?: number;
    marker2?: number;
    classification?: string;
}

export interface PlateCoordinate {
    row?: number;
    col?: number;
    sampleLabel?: number;
}
