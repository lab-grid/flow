import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { initialRun, Run } from '../models/run';
import { auth0State } from '../state/atoms';
import { policyCheckQuery, runQuery, runSamplesQuery } from '../state/selectors';
import { deleteRun, upsertRun } from '../state/api';
import moment from 'moment';
import { RunEditor } from '../components/RunEditor';

export interface RunEditorPageParams {
    id: string;
}

export function RunEditorPage() {
    const history = useHistory();
    const [runTimestamp, setRunTimestamp] = useState("");
    const [samplesPage, setSamplesPage] = React.useState(1);
    const [currentRun, setCurrentRun] = useState<Run>({});
    const { id } = useParams<RunEditorPageParams>();
    const run = useRecoilValue(runQuery({ runId: parseInt(id), queryTime: runTimestamp }));
    const policies = useRecoilValue(policyCheckQuery({ path: `/run/${parseInt(id)}`, queryTime: runTimestamp }));
    const isWritable = policies.find(policy => policy.method === 'PUT') !== undefined;
    const isDeletable = policies.find(policy => policy.method === 'DELETE') !== undefined;
    const { samples, pageCount: samplesPageCount } = useRecoilValue(runSamplesQuery({ runId: parseInt(id), queryTime: runTimestamp, filterParams: { page: `${samplesPage}` } }));
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await upsertRun(() => auth0Client, run);
        } finally {
            setRunTimestamp(moment().format());
            setCurrentRun({});
        }
    });
    const runArchive = useRecoilCallback(({ snapshot }) => async () => {
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await deleteRun(() => auth0Client, parseInt(id));
        } finally {
            history.push(`/`);
        }
    });

    console.log('isWritable, isDeletable:', isWritable, isDeletable)

    return <RunEditor
        runUpsert={runUpsert}
        samples={samples || []}
        setRun={setCurrentRun}
        run={{...initialRun, ...run, ...currentRun}}
        onDelete={runArchive}

        disableDelete={!isDeletable}
        disabled={!isWritable}

        samplesPage={samplesPage}
        samplesPageCount={samplesPageCount}
        onSamplesPageChange={setSamplesPage}
    />
}
