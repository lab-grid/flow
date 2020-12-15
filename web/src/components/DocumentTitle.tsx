import React, { useState } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { Printer, Share, Trash } from 'react-bootstrap-icons';
import { SharingModal } from './SharingModal';

export function DocumentTitle({className, targetName, targetPath, name, onDelete}: {
    className?: string;
    targetName: string;
    targetPath: string;
    name?: string;
    onDelete: () => void;
}) {
    const [showSharingModal, setShowSharingModal] = useState(false);

    return <>
        <div className={className}>
            <h1 className="mr-3">{name}</h1>
            <ButtonGroup className="ml-auto my-auto">
                <Button variant="secondary" onClick={() => setShowSharingModal(true)}>
                    <Share /> Share
                </Button>
                <Button variant="secondary" onClick={onDelete}>
                    <Trash />
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                    <Printer />
                </Button>
            </ButtonGroup>
        </div>
        <SharingModal
            show={showSharingModal}
            setShow={show => setShowSharingModal(show || false)}
            targetName={targetName}
            targetPath={targetPath}
        />
    </>;
}