import { EndThermocyclerBlockDefinition, OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, PlateSequencerBlockDefinition, StartThermocyclerBlockDefinition, TextQuestionBlockDefinition } from "./block-definition";

export type Block = TextQuestionBlock | OptionsQuestionBlock | PlateSamplerBlock | PlateAddReagentBlock | PlateSequencerBlock | StartThermocyclerBlock | EndThermocyclerBlock;

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

    outputPlateLabel?: string;
}

export interface PlateAddReagentBlock {
    type: 'plate-add-reagent';
    definition: PlateAddReagentBlockDefinition;

    plateLabel?: string;
    plateLot?: string;

    // TODO: lotId, etc.
}

export interface StartThermocyclerBlock {
    type: 'start-thermocycler';
    definition: StartThermocyclerBlockDefinition;

    thermocyclerLabel?: string;
    startedOn?: string;
}

export interface EndThermocyclerBlock {
    type: 'end-thermocycler';
    definition: EndThermocyclerBlockDefinition;

    thermocyclerLabel?: string;
    endedOn?: string;
}

export interface PlateSequencerBlock {
    type: 'plate-sequencer';
    definition: PlateSequencerBlockDefinition;

    plateLabels?: string[];
    plateSequencingResults?: PlateResult[];
}

export interface PlateResult {
    row?: number;
    col?: number;
    result?: string;
    plateLabel?: string;
}

export interface PlateCoordinate {
    row?: number;
    col?: number;
    sampleLabel?: number;
}
