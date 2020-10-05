import { OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, PlateSequencerBlockDefinition, TextQuestionBlockDefinition } from "./block-definition";

export type Block = TextQuestionBlock | OptionsQuestionBlock | PlateSamplerBlock | PlateAddReagentBlock | PlateSequencerBlock;

export interface TextQuestionBlock {
    type: 'text-question';
    definition: TextQuestionBlockDefinition;

    id?: number;
    answer?: string;
}

export interface OptionsQuestionBlock {
    type: 'options-question';
    definition: OptionsQuestionBlockDefinition;

    id?: number;
    answer?: string;
}

export interface PlateSamplerBlock {
    type: 'plate-sampler';
    definition: PlateSamplerBlockDefinition;

    id?: number;
    plateLabels?: string[];
    outputPlateLabel?: string;

    // TODO:
    // plateMappings?: Map<PlateLocation, string>[];
}

export interface PlateAddReagentBlock {
    type: 'plate-add-reagent';
    definition: PlateAddReagentBlockDefinition;

    id?: number;
    plateLabel?: string;
}

export interface PlateSequencerBlock {
    type: 'plate-sequencer';
    definition: PlateSequencerBlockDefinition;

    id?: number;
    plateLabel?: string;

    // TODO:
    // plateSequencingResults?: Map<PlateLocation, string>;
}

export interface PlateLocation {
    row?: number;
    col?: number;
}

export interface PlateCoordinate {
    row?: number;
    col?: number;
    plateLabel?: number;
}
