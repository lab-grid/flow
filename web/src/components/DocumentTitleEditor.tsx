import React, { useState } from "react";
import { Button, Col, Form } from "react-bootstrap";
import { Share } from "react-bootstrap-icons";
import { SharingModal } from "./SharingModal";

export function DocumentTitleEditor({className, disabled, targetName, targetPath, name, setName}: {
    className?: string;
    disabled?: boolean;
    targetName: string;
    targetPath: string;
    name?: string;
    setName: (name?: string) => void;
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
                <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setShowSharingModal(true)}
                >
                    <Share /> Share
                </Button>
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
