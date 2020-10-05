export type BlockDefinition = TextQuestionBlockDefinition | OptionsQuestionBlockDefinition | PlateSamplerBlockDefinition | PlateAddReagentBlockDefinition | PlateSequencerBlockDefinition;

export interface TextQuestionBlockDefinition {
    type: 'text-question';

    id?: number;
    name?: string;
    question?: string;
}

export interface OptionsQuestionBlockDefinition {
    type: 'options-question';

    id?: number;
    name?: string;
    question?: string;
    optionType?: 'switch' | 'checkbox' | 'radio' | 'menu-item' | 'user';
    options?: string[];
}

export interface PlateSamplerBlockDefinition {
    type: 'plate-sampler';

    id?: number;
    name?: string;
    plateCount?: number;
    plateSize?: 96;
}

export interface PlateAddReagentBlockDefinition {
    type: 'plate-add-reagent';

    id?: number;
    name?: string;
    plateSize?: 96 | 384;
    reagentLabel?: string;
}

export interface PlateSequencerBlockDefinition {
    type: 'plate-sequencer';

    id?: number;
    name?: string;
    plateSize?: 96 | 384;
}
