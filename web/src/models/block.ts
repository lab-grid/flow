import { EndTimestampBlockDefinition, OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, PlateSequencerBlockDefinition, StartTimestampBlockDefinition, TextQuestionBlockDefinition } from "./block-definition";

export type Block = TextQuestionBlock | OptionsQuestionBlock | PlateSamplerBlock | PlateAddReagentBlock | PlateSequencerBlock | StartTimestampBlock | EndTimestampBlock;

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

export interface PlateSequencerBlock {
    type: 'plate-sequencer';
    definition: PlateSequencerBlockDefinition;

    plateLabels?: string[];
    plateSequencingResults?: PlateResult[];
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
