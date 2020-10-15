import { OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, PlateSequencerBlockDefinition, TextQuestionBlockDefinition } from "./block-definition";

export type Block = TextQuestionBlock | OptionsQuestionBlock | PlateSamplerBlock | PlateAddReagentBlock | PlateSequencerBlock;

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

    plateLabels?: string[];
    outputPlateLabel?: string;

    // TODO:
    // plateMappings?: Map<PlateLocation, string>[];
}

export interface PlateAddReagentBlock {
    type: 'plate-add-reagent';
    definition: PlateAddReagentBlockDefinition;

    plateLabel?: string;
}

export interface PlateSequencerBlock {
    type: 'plate-sequencer';
    definition: PlateSequencerBlockDefinition;

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
