export type BlockDefinition = TextQuestionBlockDefinition | OptionsQuestionBlockDefinition | PlateSamplerBlockDefinition | PlateAddReagentBlockDefinition | PlateSequencerBlockDefinition | StartThermocyclerBlockDefinition | EndThermocyclerBlockDefinition;

export interface BlockOption {
    id: string;
    option: string;
}

export interface BlockPrimer {
    id: string;
    primer: string;
}

export interface BlockPlate<T extends number = number>{
    id: string;
    name?: string;
    size?: T;
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
}

export interface StartThermocyclerBlockDefinition {
    type: 'start-thermocycler';

    id?: string;
    name?: string;
}

export interface EndThermocyclerBlockDefinition {
    type: 'end-thermocycler';

    id?: string;
    name?: string;
}

export interface PlateSequencerBlockDefinition {
    type: 'plate-sequencer';

    id?: string;
    name?: string;
    plates?: BlockPlate[];
    plateCount?: number;
}
