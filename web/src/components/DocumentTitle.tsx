import React, { useState } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { Printer, Share, Trash } from 'react-bootstrap-icons';
import { SharingModal } from './SharingModal';

export function DocumentTitle({disableSharing, disableDelete, disablePrint, className, targetName, targetPath, name, onDelete}: {
    disableSharing?: boolean;
    disableDelete?: boolean;
    disablePrint?: boolean;
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
            {(!disableSharing || !disableDelete || !disablePrint) && <ButtonGroup className="ml-auto my-auto">
                {!disableSharing && <Button variant="secondary" onClick={() => setShowSharingModal(true)}>
                    <Share /> Share
                </Button>}
                {!disableDelete && <Button variant="secondary" onClick={onDelete}>
                    <Trash />
                </Button>}
                {!disablePrint && <Button variant="secondary" onClick={() => window.print()}>
                    <Printer />
                </Button>}
            </ButtonGroup>}
        </div>
        {!disableSharing && <SharingModal
            show={showSharingModal}
            setShow={show => setShowSharingModal(show || false)}
            targetName={targetName}
            targetPath={targetPath}
        />}
    </>;
}