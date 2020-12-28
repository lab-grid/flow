export interface User {
    id?: string;
    email?: string;
    fullName?: string;
    avatar?: string;
    roles?: string[];
}

export const userFaker = {
    id: {
        faker: 'guid',
    },
    // email: {
    //     faker: '',
    // },
    fullName: {
        faker: 'name',
    },
    // avatar: {
    //     faker: '',
    // },
    // roles: {
    //     faker: '',
    // },
};
