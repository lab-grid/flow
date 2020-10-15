export type BlockDefinition = TextQuestionBlockDefinition | OptionsQuestionBlockDefinition | PlateSamplerBlockDefinition | PlateAddReagentBlockDefinition | PlateSequencerBlockDefinition;

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
    options?: string[];
}

export interface PlateSamplerBlockDefinition {
    type: 'plate-sampler';

    id?: string;
    name?: string;
    plateCount?: number;
    plateSize?: 96;
}

export interface PlateAddReagentBlockDefinition {
    type: 'plate-add-reagent';

    id?: string;
    name?: string;
    plateSize?: 96 | 384;
    reagentLabel?: string;
}

export interface PlateSequencerBlockDefinition {
    type: 'plate-sequencer';

    id?: string;
    name?: string;
    plateSize?: 96 | 384;
}
