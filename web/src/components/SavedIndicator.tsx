import moment from 'moment';
import React from 'react';
import { CheckCircle } from 'react-bootstrap-icons';

export function SavedIndicator({className, savedOn}: {
    className?: string;
    savedOn?: string | null;
}) {
    return <div className={className}>
        {savedOn && <><CheckCircle /> Last saved on: {moment(savedOn).format('LLLL')}</>}
    </div>;
}
