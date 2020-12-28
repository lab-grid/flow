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

export type BlockAttachment = {[filename: string]: string};

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

    attachments?: BlockAttachment;
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



var user = {
    firstName: {
        faker: 'name.firstName'
    },
    lastName: {
        faker: 'name.lastName'
    },
    country: {
        faker: 'address.country'
    },
    createdAt: {
        faker: 'date.past'
    },
    username: {
        function: function() {
            return (
                this.object.lastName.substring(0, 5) +
                this.object.firstName.substring(0, 3) +
                Math.floor(Math.random() * 10)
            )
        }
    }
}
var group = {
    description: {
        faker: 'lorem.paragraph'
    },
    users: [
        {
            function: function() {
                return this.faker.random.arrayElement(this.db.user).username
            },
            length: 10,
            fixedLength: false
        }
    ]
}
var conditionalField = {
    type: {
        values: ['HOUSE', 'CAR', 'MOTORBIKE']
    },
    'object.type=="HOUSE",location': {
        faker: 'address.city'
    },
    'object.type=="CAR"||object.type=="MOTORBIKE",speed': {
        faker: 'random.number'
    }
}
