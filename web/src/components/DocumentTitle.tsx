import React, { useState } from 'react';
import { Button, ButtonGroup, Col, Form } from 'react-bootstrap';
import { Printer, Share, Trash } from 'react-bootstrap-icons';
import { SharingModal } from './SharingModal';

export function DocumentTitle({disableSharing, disableDelete, disablePrint, className, disabled, targetName, targetPath, name, setName, onDelete}: {
    disableSharing?: boolean;
    disableDelete?: boolean;
    disablePrint?: boolean;
    className?: string;
    disabled?: boolean;
    targetName: string;
    targetPath: string;
    name?: string;
    setName: (name?: string) => void;
    onDelete: () => void;
}) {
    const [showSharingModal, setShowSharingModal] = useState(false);

    return <>
        <Form.Row className={className}>
            <Col>
                <Form.Group>
                    <Form.Control
                        type="text"
                        size="lg"
                        value={name}
                        placeholder="Untitled Run"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
                        disabled={disabled}
                    />
                </Form.Group>
            </Col>
            <h1 className="mr-3">{name}</h1>
            {(!disableSharing || !disableDelete || !disablePrint) && <Col xs="auto">
                <ButtonGroup className="ml-auto my-auto">
                    {!disableSharing && <Button variant="secondary" onClick={() => setShowSharingModal(true)}>
                        <Share /> Share
                    </Button>}
                    {!disableDelete && <Button variant="secondary" onClick={onDelete}>
                        <Trash />
                    </Button>}
                    {!disablePrint && <Button variant="secondary" onClick={() => window.print()}>
                        <Printer />
                    </Button>}
                </ButtonGroup>
            </Col>}
        </Form.Row>
        {!disableSharing && <SharingModal
            show={showSharingModal}
            setShow={show => setShowSharingModal(show || false)}
            targetName={targetName}
            targetPath={targetPath}
        />}
    </>;
}