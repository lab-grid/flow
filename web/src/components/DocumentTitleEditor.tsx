import React, { useState } from "react";
import { Button, ButtonGroup, Col, Form } from "react-bootstrap";
import { Printer, Share, Trash } from "react-bootstrap-icons";
import { SharingModal } from "./SharingModal";

export function DocumentTitleEditor({className, disabled, targetName, targetPath, name, setName, onDelete}: {
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
                        placeholder="Untitled Protocol"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
                        disabled={disabled}
                    />
                </Form.Group>
            </Col>
            <Col xs="auto">
                <ButtonGroup size="lg">
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
            </Col>
        </Form.Row>
        <SharingModal
            show={showSharingModal}
            setShow={show => setShowSharingModal(show || false)}
            targetName={targetName}
            targetPath={targetPath}
        />
    </>
}
