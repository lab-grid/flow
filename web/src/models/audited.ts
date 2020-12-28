export interface Audited {
    created_on?: string;
    created_by?: string;
    updated_on?: string;
    updated_by?: string;
}

export const auditedFaker = {
    created_on: {
        faker: 'date.past',
    },
    created_by: {
        faker: 'guid',
    },
    updated_on: {
        faker: 'date.past',
    },
    updated_by: {
        faker: 'guid',
    },
};
