import moment from 'moment';
import React, { useState } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { useRecoilValue } from 'recoil';
import { Block } from '../models/block';
import { Section } from '../models/run';
import { auth0State } from '../state/atoms';
import { userQuery } from '../state/selectors';
import { RunBlockEditor } from './RunBlockEditor';

export function RunSectionEditor({disabled, index, section, setSection, syncSection}: {
    disabled?: boolean;
    index: number;
    section?: Section;
    setSection: (section?: Section) => void;
    syncSection: (section?: Section) => void;
}) {
    const [userTimestamp] = useState("");
    const { user: auth0User } = useRecoilValue(auth0State);
    const loggedInUser = useRecoilValue(userQuery({userId: auth0User && auth0User.sub, queryTime: userTimestamp}));

    const currentBlocks = (section && section.blocks) || [];
    const currentSignature = (section && section.signature) || '';
    const currentWitness = (section && section.witness) || '';

    const isSigned = (section && !!section.signedOn) || false;
    const isWitnessed = (section && !!section.witnessedOn) || false;
    
    const updateBlock = (block?: Block) => {
        if (block && section) {
            setSection({
                ...section,
                blocks: currentBlocks.map(b => (b.definition.id === block.definition.id) ? block : b),
            });
        }
    };

    return <>
        <h2 className="row">
            <i>Section: {(section && section.definition.name) || 'Untitled Section'}</i>
        </h2>

        {currentBlocks.map(block => {
            if (!block || !block.definition || !block.definition.id) {
                return undefined;
            }
            return <div key={block.definition.id}>
              <RunBlockEditor
                key={block.definition.id}
                block={block}
                setBlock={updateBlock}
                disabled={isSigned || isWitnessed}
              />
            </div>
        })}

        <div className="row">
            <Form.Group className="col-3 ml-auto">
                <Form.Label>Signature</Form.Label>
                <InputGroup>
                    <Form.Control
                        className="flow-signature"
                        type="text"
                        value={currentSignature}
                        disabled={true}
                    />
                    <InputGroup.Append>
                        <Button variant="secondary" onClick={() => {
                            if (section) {
                                if (isSigned || isWitnessed) {
                                    const { signature, witness, signedOn, witnessedOn, ...newSection} = section;
                                    syncSection(newSection);
                                } else {
                                    if (loggedInUser) {
                                        syncSection({
                                            ...section,
                                            signature: loggedInUser.fullName,
                                            signedOn: moment().format(),
                                        });
                                    }
                                }
                            }
                        }}>
                            {(isSigned || isWitnessed) ? 'Un-sign' : 'Sign'}
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>
        </div>

        {
            section && section.signedOn && <div className="row">
                <div className="col-3 ml-auto">
                    Signed On: {moment(section && section.signedOn).format('LLL')}
                </div>
            </div>
        }

        <div className="row">
            <Form.Group className="col-3 ml-auto">
                <Form.Label>Witness</Form.Label>
                <InputGroup>
                    <Form.Control
                        className="flow-signature"
                        type="text"
                        value={currentWitness}
                        disabled={true}
                    />
                    <InputGroup.Append>
                        <Button variant="secondary" disabled={!isSigned} onClick={() => {
                            if (section) {
                                if (isWitnessed) {
                                    const { witness, witnessedOn, ...newSection} = section;
                                    syncSection(newSection)
                                } else {
                                    if (loggedInUser) {
                                        syncSection({
                                            ...section,
                                            witness: loggedInUser.fullName,
                                            witnessedOn: moment().format(),
                                        });
                                    }
                                }
                            }
                        }}>
                            {isWitnessed ? 'Un-sign' : 'Sign'}
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>
        </div>

        {
            section && section.witnessedOn && <div className="row">
                <div className="col-3 ml-auto">
                    Witnessed On: {moment(section && section.witnessedOn).format('LLL')}
                </div>
            </div>
        }
    </>
}
