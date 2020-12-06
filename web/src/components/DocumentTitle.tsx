import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { Share } from 'react-bootstrap-icons';
import { SharingModal } from './SharingModal';

export function DocumentTitle({className, targetName, targetPath, name}: {
    className?: string;
    targetName: string;
    targetPath: string;
    name?: string;
}) {
    const [showSharingModal, setShowSharingModal] = useState(false);

    return <>
        <div className={className}>
            <h1 className="mr-3">{name}</h1>
            <Button className="ml-auto my-auto" variant="secondary" onClick={() => setShowSharingModal(true)}>
                <Share /> Share
            </Button>
        </div>
        <SharingModal
            show={showSharingModal}
            setShow={show => setShowSharingModal(show || false)}
            targetName={targetName}
            targetPath={targetPath}
        />
    </>;
}