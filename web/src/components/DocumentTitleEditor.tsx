import React, { useState } from "react";
import { Button, ButtonGroup, Col, Form } from "react-bootstrap";
import { ChevronLeft, ChevronRight, Printer, Share, Trash } from "react-bootstrap-icons";
import { SharingModal } from "./SharingModal";

export function DocumentTitleEditor({
    disableSharing,
    disablePrint,
    disablePreview,
    className,
    disabled,
    targetName,
    targetPath,
    showPreview,
    setShowPreview,
    name,
    setName,
    onDelete,
}: {
    disableSharing?: boolean;
    disablePrint?: boolean;
    disablePreview?: boolean;
    className?: string;
    disabled?: boolean;
    targetName: string;
    targetPath: string;
    showPreview?: boolean;
    setShowPreview: (showPreview: boolean) => void;
    name?: string;
    setName: (name?: string) => void;
    onDelete?: () => void;
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
            {(!disableSharing || onDelete || !disablePrint) && <Col xs="auto">
                <ButtonGroup size="lg">
                    {!disableSharing && <Button variant="secondary" onClick={() => setShowSharingModal(true)}>
                        <Share /> Share
                    </Button>}
                    {onDelete && <Button variant="secondary" onClick={onDelete}>
                        <Trash />
                    </Button>}
                    {!disablePrint && <Button variant="secondary" onClick={() => window.print()}>
                        <Printer />
                    </Button>}
                    {!disablePreview && <Button variant="secondary" onClick={() => setShowPreview(!showPreview)} active={showPreview}>
                        {showPreview ? <ChevronLeft /> : <ChevronRight />}
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
    </>
}
