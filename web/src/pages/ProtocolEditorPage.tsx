import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { initialProtocol, Protocol } from '../models/protocol';
import { auth0State } from '../state/atoms';
import { protocolQuery, userQuery } from '../state/selectors';
import { deleteProtocol, patchProtocol, upsertRun } from '../state/api';
import moment from 'moment';
import { initialRun, Run, Section } from '../models/run';
import { ProtocolEditor } from '../components/ProtocolEditor';
import { RunEditor } from '../components/RunEditor';
import { Block } from '../models/block';
import { compare } from 'fast-json-patch';

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

export interface ProtocolEditorPageParams {
    id: string;
}

export function ProtocolEditorPage() {
    const history = useHistory();
    const [protocolTimestamp, setProtocolTimestamp] = useState("");
    const [currentProtocol, setCurrentProtocol] = useState<Protocol>({});
    const [showPreview, setShowPreview] = useState(false);
    const { id } = useParams<ProtocolEditorPageParams>();
    const [userTimestamp] = useState("");
    const { user: auth0User } = useRecoilValue(auth0State);
    const loggedInUser = useRecoilValue(userQuery({userId: auth0User && auth0User.sub, queryTime: userTimestamp}));
    const protocol = useRecoilValue(protocolQuery({ protocolId: parseInt(id), queryTime: protocolTimestamp }));
    const [currentRun, setCurrentRun] = useState<Run>({
        ...initialRun,
        ...(protocol ? newRun(protocol) : {}),
    });

    const protocolUpsert = useRecoilCallback(({ snapshot }) => async (updatedProtocol: Protocol) => {
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            // TODO: Use an observer to gather these changes instead of this slow compare operation.
            const patch = compare(protocol || {}, updatedProtocol);
            const protocolId = updatedProtocol.id || parseInt(id);
            return await patchProtocol(() => auth0Client, protocolId, patch);
            // return await upsertProtocol(() => auth0Client, updatedProtocol);
        } finally {
            setProtocolTimestamp(moment().format());
            setCurrentProtocol({});
        }
    });
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        return await upsertRun(() => auth0Client, run);
    });
    const protocolArchive = useRecoilCallback(({ snapshot }) => async () => {
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await deleteProtocol(() => auth0Client, parseInt(id));
        } finally {
            history.push(`/`);
        }
    });

    const updateProtocol = (protocol: Protocol) => {
        setCurrentProtocol(protocol);
        setCurrentRun({
            ...initialRun,
            ...currentRun,
            ...newRun(protocol),
        });
    }

    const protocolCol = <div className="col p-0">
        <ProtocolEditor
            runUpsert={runUpsert}
            protocolUpsert={protocolUpsert}
            setProtocol={updateProtocol}
            protocol={{
                ...initialProtocol,
                ...protocol,
                ...currentProtocol,
            }}
            showPreview={showPreview}
            setShowPreview={setShowPreview}
            loggedInUser={loggedInUser}
            onDelete={protocolArchive}
        />
    </div>;
    const runCol = <div className="col p-0">
        <RunEditor
            runUpsert={async run => run}
            setRun={setCurrentRun}
            run={{...initialRun, ...currentRun}}
            disableSharing={true}
            disablePrint={true}
            disableSave={true}
        />
    </div>;

    if (showPreview) {
        return <div className="d-flex px-3 pb-3">
            {protocolCol}
            {runCol}
        </div>
    } else {
        return <div className="container pb-3">
            {protocolCol}
        </div>
    }
}
