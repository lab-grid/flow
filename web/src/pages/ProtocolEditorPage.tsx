import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { Protocol } from '../models/protocol';
import { auth0State } from '../state/atoms';
import { protocolQuery, upsertProtocol, upsertRun, userQuery } from '../state/selectors';
import moment from 'moment';
import { Run } from '../models/run';
import { ProtocolEditor } from '../components/ProtocolEditor';
import { initialSlateValue, serializeSlate } from '../slate';
import { RunEditor } from '../components/RunEditor';

const initialRun: Run = {
    sections: [],
    sampleOverrides: [],
    status: "todo",
    notes: serializeSlate(initialSlateValue),
};

const initialProtocol: Protocol = {
    name: '',
    description: serializeSlate(initialSlateValue),
    sections: [],
    signature: '',
    witness: '',
};

export interface ProtocolEditorPageParams {
    id: string;
}

export function ProtocolEditorPage() {
    const [protocolTimestamp, setProtocolTimestamp] = useState("");
    const [currentProtocol, setCurrentProtocol] = useState<Protocol>({});
    const [currentRun, setCurrentRun] = useState<Run>({});
    const { id } = useParams<ProtocolEditorPageParams>();
    const [userTimestamp] = useState("");
    const { user: auth0User } = useRecoilValue(auth0State);
    const loggedInUser = useRecoilValue(userQuery({userId: auth0User && auth0User.sub, queryTime: userTimestamp}));
    const protocol = useRecoilValue(protocolQuery({ protocolId: parseInt(id), queryTime: protocolTimestamp }));

    const protocolUpsert = useRecoilCallback(({ snapshot }) => async (protocol: Protocol) => {
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await upsertProtocol(() => auth0Client, protocol);
        } finally {
            setProtocolTimestamp(moment().format());
            setCurrentProtocol({});
        }
    });
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        return await upsertRun(() => auth0Client, run);
    });

    const updateProtocol = (protocol: Protocol) => {
        setCurrentProtocol(protocol);
        setCurrentRun({
            ...initialRun,
            ...currentRun,
            protocol,
        });
    }

    return <div className="d-md-flex h-md-100 align-items-center">
        <div className="col-md-6 p-0 h-md-100">
            <RunEditor
                runUpsert={async run => run}
                samples={[]}
                setRun={setCurrentRun}
                run={{...initialRun, ...currentRun}}
            />
        </div>
        <div className="col-md-6 p-0 h-md-100">
            <ProtocolEditor
                runUpsert={runUpsert}
                protocolUpsert={protocolUpsert}
                setProtocol={updateProtocol}
                protocol={{
                    ...initialProtocol,
                    ...protocol,
                    ...currentProtocol,
                }}
                loggedInUser={loggedInUser}
            />
        </div>
    </div>;
}
