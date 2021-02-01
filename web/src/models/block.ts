import { CalculatorBlockDefinition, EndTimestampBlockDefinition, OptionsQuestionBlockDefinition, PlateAddReagentBlockDefinition, PlateSamplerBlockDefinition, EndPlateSequencerBlockDefinition, StartTimestampBlockDefinition, TextQuestionBlockDefinition, StartPlateSequencerBlockDefinition, AddReagentBlockDefinition } from "./block-definition";
import { PlateCoordinate } from "./plate-coordinate";
import { PlateResult } from "./plate-result";

export type Block = TextQuestionBlock
    | OptionsQuestionBlock
    | CalculatorBlock
    | PlateSamplerBlock
    | PlateAddReagentBlock
    | AddReagentBlock
    | StartPlateSequencerBlock
    | EndPlateSequencerBlock
    | StartTimestampBlock
    | EndTimestampBlock;

export type BlockAttachment = {[filename: string]: string};

export type PlateMapping = {
    label?: string;
    coordinates?: PlateCoordinate[];
};

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

    plates?: PlateMapping[]
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

export interface AddReagentBlock {
    type: 'add-reagent';
    definition: AddReagentBlockDefinition;

    reagentLot?: string;

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

    attachments?: BlockAttachment;
    plateSequencingResults?: PlateResult[];
    timestampLabel?: string;
    endedOn?: string;
}
