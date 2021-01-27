import moment from "moment";
import * as uuid from "uuid";
import React, { useState } from "react";
import { Button, Col, Form } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { useRecoilState } from "recoil";
import { Block } from "../models/block";
import { Protocol, SectionDefinition } from "../models/protocol";
import { Run, Section } from "../models/run";
import { User } from "../models/user";
import { deserializeSlate, initialSlateValue, serializeSlate } from "../slate";
import { FetchError } from "../state/api";
import { errorsState } from "../state/atoms";
import { DocumentTitleEditor } from "./DocumentTitleEditor";
import { Draggable } from "./Draggable";
import { ProtocolSectionEditor } from "./ProtocolSectionEditor";
import { SaveButton } from "./SaveButton";
import { SavedIndicator } from "./SavedIndicator";
import { SignatureEditor } from "./SignatureEditor";
import { SlateInput } from "./SlateInput";
import { ImportExportModal } from "./ImportExportModal";

function newRun(protocol: Protocol): Run {
    return {
        status: 'todo',
        sections: protocol.sections && protocol.sections.map(section => ({
            definition: section,
            blocks: section.blocks && section.blocks.map(definition => ({
                type: definition.type,
                definition,
            } as Block)),
        } as Section)),
        protocol,
    };
}

export function ProtocolEditor({ disableSharing, disablePrint, disableSave, disablePreview, loggedInUser, showPreview, setShowPreview, protocol, setProtocol, protocolUpsert, runUpsert, onDelete }: {
    disableSharing?: boolean;
    disablePrint?: boolean;
    disableSave?: boolean;
    disablePreview?: boolean;
    loggedInUser?: User;
    showPreview?: boolean;
    setShowPreview: (showPreview: boolean) => void;
    protocol?: Protocol;
    setProtocol: (protocol: Protocol) => void;
    protocolUpsert: (protocol: Protocol) => Promise<Protocol>;
    runUpsert: (run: Run) => Promise<Run>;
    onDelete?: () => void;
}) {
    const history = useHistory();
    const [formSaving, setFormSaving] = useState<boolean>(false);
    const [formSavedTime, setFormSavedTime] = useState<string | null>(null);
    const [showImportExportModal, setShowImportExportModal] = useState(false);
    const [errors, setErrors] = useRecoilState(errorsState);

    if (!protocol) {
        protocol = {};
    }

    const isSigned = !!protocol.signedOn || false;
    const isWitnessed = !!protocol.witnessedOn || false;

    
    const addSection = (section?: SectionDefinition) => {
        if (section) {
            const sections = (protocol && protocol.sections) || [];
            setProtocol({...protocol, sections: [...sections, section]});
        }
    };
    const updateSection = (section?: SectionDefinition) => {
        if (section) {
            const sections = (protocol && protocol.sections) || [];
            setProtocol({...protocol, sections: sections.map(b => (b.id === section.id) ? section : b)});
        }
    };
    const moveSection = React.useCallback(
        (dragIndex: number, hoverIndex: number) => {
            const sections = (protocol && protocol.sections) || [];
            const dragSection = sections[dragIndex]
            const newSections = [...sections];
            newSections.splice(dragIndex, 1);
            newSections.splice(hoverIndex, 0, dragSection);
            setProtocol({...protocol, sections: newSections});
        },
        [protocol, setProtocol],
    );
    const deleteSection = (sectionId?: string) => {
        if (sectionId) {
            const sections = (protocol && protocol.sections) || [];
            setProtocol({...protocol, sections: sections.filter(b => b.id !== sectionId)});
        }
    };

    const syncProtocol = async (override?: Protocol) => {
        const newProtocol = Object.assign({}, protocol, override);

        setFormSaving(true);
        try {
            return await protocolUpsert(newProtocol);
        } catch (e) {
            if (e instanceof FetchError) {
                const err: FetchError = e;
                setErrors({
                    ...errors,
                    errors: [...(errors.errors || []), err],
                });
            }
        } finally {
            setFormSaving(false);
            setFormSavedTime(moment().format());
        }
    };

    const createRun = async () => {
        const protocol = await syncProtocol();
        if (!protocol) {
            return;
        }

        setFormSaving(true);
        try {
            const created = await runUpsert(newRun(protocol));
            // Redirect to the new run page editor
            history.push(`/run/${created.id}`);
            return created;
        } catch (e) {
            if (e instanceof FetchError) {
                const err: FetchError = e;
                setErrors({
                    ...errors,
                    errors: [...(errors.errors || []), err],
                });
            }
        } finally {
            setFormSaving(false);
            setFormSavedTime(moment().format());
        }
    };

    return <>
        <ImportExportModal
            show={showImportExportModal}
            setShow={setShowImportExportModal}
            value={protocol}
            setData={setProtocol}
        />
        <Form>
            <DocumentTitleEditor
                disableSharing={disableSharing}
                disablePrint={disablePrint}
                disablePreview={disablePreview}
                className="bg-secondary pt-4 pb-3 px-2"
                disabled={isSigned || isWitnessed}
                targetName="Protocol"
                targetPath={`/protocol/${protocol.id}`}
                showPreview={showPreview}
                setShowPreview={setShowPreview}
                name={protocol.name}
                setName={name => setProtocol({...protocol, name})}
                onDelete={onDelete}
            />
            <Form.Row className="bg-secondary px-2">
                <Col>
                    <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <SlateInput
                            disabled={isSigned || isWitnessed}
                            value={protocol.description ? deserializeSlate(protocol.description) : initialSlateValue}
                            placeholder="Enter a description here..."
                            onChange={description => setProtocol({...protocol, description: serializeSlate(description || initialSlateValue)})}
                        />
                    </Form.Group>
                </Col>
            </Form.Row>

            {protocol.sections && protocol.sections.filter(section => section && section.id).map((section, index) => 
                <Draggable
                    key={section.id}
                    type="protocol-section"
                    index={index}
                    move={moveSection}
                >
                    <ProtocolSectionEditor
                        disabled={isSigned || isWitnessed}
                        index={index}
                        section={section}
                        setSection={updateSection}
                        deleteSection={() => deleteSection(section && section.id)}
                    />
                </Draggable>
            )}

            {
                !isSigned && !isWitnessed && <div className="d-flex">
                    <Button
                        className="col-auto my-3 mx-auto"
                        onClick={() => addSection({ id: uuid.v4() })}
                    >
                        Add a new section
                    </Button>
                </div>
            }

            <div className="d-flex">
                <SignatureEditor
                    className="col-4 ml-auto"
                    label="Protocol Signature"
                    signature={protocol.signature}
                    signedOn={protocol.signedOn}
                    onSign={() => {
                        if (loggedInUser) {
                            syncProtocol({
                                signature: loggedInUser.fullName,
                                signedOn: moment().format(),
                            });
                        }
                    }}
                    onUnsign={() => syncProtocol({
                        signature: "",
                        signedOn: "",
                    })}
                />
            </div>

            <div className="d-flex">
                <SignatureEditor
                    className="col-4 ml-auto"
                    disabled={!isSigned}
                    label="Protocol Witness"
                    signature={protocol.witness}
                    signedOn={protocol.witnessedOn}
                    onSign={() => {
                        if (loggedInUser) {
                            syncProtocol({
                                witness: loggedInUser.fullName,
                                witnessedOn: moment().format(),
                            });
                        }
                    }}
                    onUnsign={() => syncProtocol({
                        witness: "",
                        witnessedOn: "",
                    })}
                />
            </div>

            {!disableSave && <div className="d-flex">
                <Button
                    className="col-auto"
                    variant="success"
                    onClick={createRun}
                    disabled={formSaving}
                >
                    Create Run
                </Button>
                <SaveButton
                    className="col-auto ml-3"
                    onClick={() => syncProtocol()}
                    disabled={formSaving}
                />
                <SavedIndicator
                    className="col-auto mr-auto my-auto"
                    savedOn={formSavedTime}
                />
            </div>}
        </Form>
    </>;
}
