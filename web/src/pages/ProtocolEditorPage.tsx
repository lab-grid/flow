import React, { useState } from 'react';
import { Button, Col, Form } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { Node } from 'slate';
import { Protocol, SectionDefinition } from '../models/protocol';
import { auth0State, errorsState } from '../state/atoms';
import { protocolQuery, upsertProtocol, upsertRun, userQuery } from '../state/selectors';
import * as uuid from 'uuid';
import moment from 'moment';
import { deserializeSlate, serializeSlate } from '../slate';
import { Block } from '../models/block';
import { Run, Section } from '../models/run';
import { FetchError } from '../state/api';
import { Draggable } from '../components/Draggable';
import { ProtocolSectionEditor } from '../components/ProtocolSectionEditor';
import { SaveButton } from '../components/SaveButton';
import { SavedIndicator } from '../components/SavedIndicator';
import { SignatureEditor } from '../components/SignatureEditor';
import { SlateInput } from '../components/SlateInput';
import { DocumentTitleEditor } from '../components/DocumentTitleEditor';

const initialSlateValue: Node[] = [
    {
        type: 'paragraph',
        children: [
            { text: '' }
        ],
    }
];

export interface ProtocolEditorPageParams {
    id: string;
}

export function ProtocolEditorPage() {
    const history = useHistory();
    const [protocolTimestamp, setProtocolTimestamp] = useState("");
    const [name, setName] = useState<string | null>(null);
    const [description, setDescription] = useState<Node[] | null>(null);
    const [sections, setSections] = useState<SectionDefinition[] | null>(null);
    const [formSaving, setFormSaving] = useState<boolean>(false);
    const [formSavedTime, setFormSavedTime] = useState<string | null>(null);
    const { id } = useParams<ProtocolEditorPageParams>();
    const [userTimestamp] = useState("");
    const { user: auth0User } = useRecoilValue(auth0State);
    const loggedInUser = useRecoilValue(userQuery({userId: auth0User && auth0User.sub, queryTime: userTimestamp}));
    const protocol = useRecoilValue(protocolQuery({ protocolId: parseInt(id), queryTime: protocolTimestamp }));
    const [errors, setErrors] = useRecoilState(errorsState);

    const currentName = React.useMemo(
        () => ((name !== null)
            ? name
            : (protocol && protocol.name)) || '',
        [name, protocol]
    );
    const currentDescription = React.useMemo(
        () => ((description !== null)
            ? description
            : (protocol && protocol.description && deserializeSlate(protocol.description))) || initialSlateValue,
        [description, protocol]
    );
    const currentSections = React.useMemo(
        () => ((sections !== null)
            ? sections
            : (protocol && protocol.sections)) || [],
        [sections, protocol]
    );
    const currentSignature = React.useMemo(
        () => (protocol && protocol.signature) || '',
        [protocol]
    );
    const currentWitness = React.useMemo(
        () => (protocol && protocol.witness) || '',
        [protocol]
    );
    const isSigned = (protocol && !!protocol.signedOn) || false;
    const isWitnessed = (protocol && !!protocol.witnessedOn) || false;

    const protocolUpsert = useRecoilCallback(({ snapshot }) => async (protocol: Protocol) => {
        setFormSaving(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await upsertProtocol(() => auth0Client, protocol);
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
            setProtocolTimestamp(moment().format());
            setName(null);
            setDescription(null);
            setSections(null);
        }
    });
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        return await upsertRun(() => auth0Client, run);
    });

    const addSection = (section?: SectionDefinition) => {
        if (section) {
            setSections([...currentSections, section]);
        }
    };
    const updateSection = (section?: SectionDefinition) => {
        if (section) {
            setSections(currentSections.map(b => (b.id === section.id) ? section : b));
        }
    };
    const moveSection = React.useCallback(
        (dragIndex: number, hoverIndex: number) => {
            const dragSection = currentSections[dragIndex]
            const newSections = [...currentSections];
            newSections.splice(dragIndex, 1);
            newSections.splice(hoverIndex, 0, dragSection);
            setSections(newSections);
        },
        [currentSections],
    );
    const deleteSection = (sectionId?: string) => {
        if (sectionId) {
            setSections(currentSections.filter(b => b.id !== sectionId));
        }
    };

    const syncProtocol = (override?: Protocol) => {
        const newProtocol: Protocol = Object.assign({
            id: parseInt(id),
            name: currentName,
            description: serializeSlate(currentDescription),
            sections: currentSections,
            signature: currentSignature,
            witness: currentWitness,
        }, override);
        if (protocol && protocol.signedOn) {
            newProtocol.signedOn = protocol.signedOn;
        }
        if (protocol && protocol.witnessedOn) {
            newProtocol.witnessedOn = protocol.witnessedOn;
        }
        protocolUpsert(newProtocol);
    };

    const createRun = async () => {
        if (!protocol) {
            return;
        }
        // Create new run
        const created = await runUpsert({
            status: 'todo',
            sections: protocol.sections && protocol.sections.map(section => ({
                definition: section,
                blocks: section.blocks && section.blocks.map(definition => ({
                    type: definition.type,
                    definition,
                } as Block)),
            } as Section)),
            protocol,
        });
        // Redirect to the new run page editor
        history.push(`/run/${created.id}`);
    };

    return <>
        <Form>
            <DocumentTitleEditor
                className="bg-secondary pt-4 pb-3 px-2"
                disabled={isSigned || isWitnessed}
                targetName="Protocol"
                targetPath={`/protocol/${id}`}
                name={currentName}
                setName={setName}
            />
            <Form.Row className="bg-secondary px-2">
                <Col>
                    <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <SlateInput
                            disabled={isSigned || isWitnessed}
                            value={currentDescription}
                            placeholder="Enter a description here..."
                            onChange={setDescription}
                        />
                    </Form.Group>
                </Col>
            </Form.Row>

            {currentSections.filter(section => section && section.id).map((section, index) => 
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
                !isSigned && !isWitnessed && <div className="row">
                    <Button
                        className="col-auto my-3 mx-auto"
                        onClick={() => addSection({ id: uuid.v4() })}
                    >
                        Add a new section
                    </Button>
                </div>
            }

            <div className="row">
                <SignatureEditor
                    className="col-4 ml-auto"
                    label="Protocol Signature"
                    signature={currentSignature}
                    signedOn={protocol && protocol.signedOn}
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

            <div className="row">
                <SignatureEditor
                    className="col-4 ml-auto"
                    disabled={!isSigned}
                    label="Protocol Witness"
                    signature={currentWitness}
                    signedOn={protocol && protocol.witnessedOn}
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

            <div className="row">
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
            </div>
        </Form>
    </>;
}
