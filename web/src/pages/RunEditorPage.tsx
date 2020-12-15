import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { Run } from '../models/run';
import { auth0State } from '../state/atoms';
import { runQuery, runSamplesQuery, upsertRun } from '../state/selectors';
import { initialSlateValue, serializeSlate } from '../slate';
import moment from 'moment';
import { RunEditor } from '../components/RunEditor';

const initialRun: Run = {
    sections: [],
    sampleOverrides: [],
    status: "todo",
    notes: serializeSlate(initialSlateValue),
};

export interface RunEditorPageParams {
    id: string;
}

export function RunEditorPage() {
    const [runTimestamp, setRunTimestamp] = useState("");
    const [currentRun, setCurrentRun] = useState<Run>({});
    const { id } = useParams<RunEditorPageParams>();
    const run = useRecoilValue(runQuery({ runId: parseInt(id), queryTime: runTimestamp }));
    const samples = useRecoilValue(runSamplesQuery({ runId: parseInt(id), queryTime: runTimestamp }));
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await upsertRun(() => auth0Client, run);
        } finally {
            setRunTimestamp(moment().format());
            setCurrentRun({});
        }
    });

    return <RunEditor
        runUpsert={runUpsert}
        samples={samples}
        setRun={setCurrentRun}
        run={{...initialRun, ...run, ...currentRun}}
    />
}
