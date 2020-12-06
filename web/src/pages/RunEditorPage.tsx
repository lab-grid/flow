import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { Node } from 'slate';
import { calculateRunStatus, humanizeRunName, Run, Section } from '../models/run';
import { auth0State, errorsState } from '../state/atoms';
import { runQuery, runSamplesQuery, upsertRun } from '../state/selectors';
import { deserializeSlate, serializeSlate } from '../slate';
import moment from 'moment';
import { FetchError } from '../state/api';
import { ResultsTable } from '../components/ResultsTable';
import { exportSampleResultsToCSV } from '../models/sample-result';
import { RunSectionEditor } from '../components/RunSectionEditor';
import { SaveButton } from '../components/SaveButton';
import { SavedIndicator } from '../components/SavedIndicator';
import { SlateInput } from '../components/SlateInput';
import { DocumentTitle } from '../components/DocumentTitle';

const initialSlateValue: Node[] = [
    {
        type: 'paragraph',
        children: [
            { text: '' }
        ],
    }
];

export interface RunEditorPageParams {
    id: string;
}

export function RunEditorPage() {
    const [runTimestamp, setRunTimestamp] = useState("");
    const [notes, setNotes] = useState<Node[] | null>(null);
    const [sections, setSections] = useState<Section[] | null>(null);
    const [formSaving, setFormSaving] = useState<boolean>(false);
    const [formSavedTime, setFormSavedTime] = useState<string | null>(null);
    const { id } = useParams<RunEditorPageParams>();
    const run = useRecoilValue(runQuery({ runId: parseInt(id), queryTime: runTimestamp }));
    const [errors, setErrors] = useRecoilState(errorsState);
    const samples = useRecoilValue(runSamplesQuery({ runId: parseInt(id), queryTime: runTimestamp }));
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        setFormSaving(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await upsertRun(() => auth0Client, run);
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
            setRunTimestamp(moment().format());
            setNotes(null);
            setSections(null);
        }
    });

    const currentNotes = React.useMemo(
        () => ((notes !== null)
            ? notes
            : (run && run.notes && deserializeSlate(run.notes))) || initialSlateValue,
        [notes, run],
    );
    const currentSections = React.useMemo(
        () => ((sections !== null)
            ? sections
            : (run && run.sections)) || [],
        [sections, run],
    );
    const isCompleted = (run && run.status) === 'completed';

    const updateSection = (section?: Section) => {
        if (section) {
            setSections(currentSections.map(b => (b.definition.id === section.definition.id) ? section : b));
        }
    };

    const syncRun = (override?: Run) => {
        const run: Run = Object.assign({
            id: parseInt(id),
            notes: serializeSlate(currentNotes),
            sections: currentSections,
        }, override);
        run.status = calculateRunStatus(run);
        runUpsert(run);
    };
    const syncSection = (index: number) => (override?: Section) => {
        if (override) {
            syncRun({
                sections: currentSections.map((s, i) => i === index ? override : s),
            })
        } else {
            syncRun();
        }
    }

    const exportSamples = () => {
        if (!samples) {
            return;
        }
        exportSampleResultsToCSV(`export-sample-results-${moment().format()}`, samples, true);
    };

    return <>
        <Form className="mt-4 container">
            <DocumentTitle
                className="row"
                targetName="Run"
                targetPath={`/run/${id}`}
                name={humanizeRunName(run)}
            />
            <br></br>
            <Form.Group>
                <Form.Label>Notes</Form.Label>
                <SlateInput
                    disabled={isCompleted}
                    value={currentNotes}
                    placeholder="Enter run notes here..."
                    onChange={setNotes}
                />
            </Form.Group>
            {currentSections.map((section, i) => {
                if (!section || !section.definition || !section.definition.id) {
                    return undefined;
                }
                return <RunSectionEditor
                    key={section.definition.id}
                    index={i}
                    section={section}
                    setSection={updateSection}
                    syncSection={syncSection(i)}
                />
            })}

            <div className="row">
                <small className="col-auto my-auto">Samples (<i><a href="/#" onClick={exportSamples}>Export to CSV</a></i>)</small>
                <hr className="col my-auto" />
                <small className="col-auto my-auto">
                    {(samples && samples.length) || 0}
                </small>
            </div>
            <ResultsTable results={samples || []} />

            <div className="row">
                <SaveButton
                    className="col-auto ml-3"
                    onClick={() => syncRun()}
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
