import moment from 'moment';
import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { Block } from '../models/block';
import { Section } from '../models/run';
import { auth0State } from '../state/atoms';
import { userQuery } from '../state/selectors';
import { RunBlockEditor } from './RunBlockEditor';
import { SignatureEditor } from './SignatureEditor';

export function RunSectionEditor({disabled, runId, index, section, setSection, syncSection}: {
    disabled?: boolean;
    runId: number;
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

    const syncBlock = (block?: Block) => {
        if (block && section) {
            syncSection({
                ...section,
                blocks: currentBlocks.map(b => (b.definition.id === block.definition.id) ? block : b),
            });
        }
    }

    return <>
        <h2 className="row">
            <i>Section {index + 1}: {(section && section.definition.name) || 'Untitled Section'}</i>
        </h2>

        {currentBlocks.map(block => {
            if (!block || !block.definition || !block.definition.id) {
                return undefined;
            }
            return <div key={block.definition.id}>
              <RunBlockEditor
                key={block.definition.id}
                runId={runId}
                block={block}
                setBlock={updateBlock}
                syncBlock={syncBlock}
                disabled={isSigned || isWitnessed || disabled}
              />
            </div>
        })}

        {
            section && section.definition.requiresSignature && <div className="row">
                <SignatureEditor
                    className="col-4 ml-auto"
                    disabled={disabled}
                    label="Signature"
                    signature={currentSignature}
                    signedOn={section && section.signedOn}
                    onSign={() => {
                        if (section && loggedInUser) {
                            syncSection({
                                ...section,
                                signature: loggedInUser.fullName,
                                signedOn: moment().format(),
                            });
                        }
                    }}
                    onUnsign={() => {
                        if (section) {
                            syncSection({
                                ...section,
                                signature: "",
                                signedOn: undefined,
                            });
                        }
                    }}
                />
            </div>
        }

        {
            section && section.definition.requiresWitness && <div className="row">
                <SignatureEditor
                    className="col-4 ml-auto"
                    disabled={!isSigned || disabled}
                    label="Witness"
                    signature={currentWitness}
                    signedOn={section && section.witnessedOn}
                    onSign={() => {
                        if (section && loggedInUser) {
                            syncSection({
                                ...section,
                                witness: loggedInUser.fullName,
                                witnessedOn: moment().format(),
                            });
                        }
                    }}
                    onUnsign={() => {
                        if (section) {
                            syncSection({
                                ...section,
                                witness: "",
                                witnessedOn: undefined,
                            });
                        }
                    }}
                />
            </div>
        }
    </>
}
