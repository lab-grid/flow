import moment from "moment";
import React, { useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { useRecoilCallback, useRecoilState } from "recoil";
import { Run, Section, calculateRunStatus, humanizeRunName } from "../models/run";
import { SampleResult, exportSampleResultsToCSV } from "../models/sample-result";
import { deserializeSlate, initialSlateValue, serializeSlate } from "../slate";
import { exportRunSamples, FetchError, getRunSamples } from "../state/api";
import { auth0State, errorsState } from "../state/atoms";
import { DocumentTitle } from "./DocumentTitle";
import { ResultsTable } from "./ResultsTable";
import { RunSectionEditor } from "./RunSectionEditor";
import { SaveButton } from "./SaveButton";
import { SavedIndicator } from "./SavedIndicator";
import { SlateInput } from "./SlateInput";
import { ImportExportModal } from './ImportExportModal';

export function RunEditor({
    disableSharing,
    disablePrint,
    disableSave,
    disabled,
    samples,
    run,
    setRun,
    runUpsert,
    onDelete,

    samplesPage,
    samplesPageCount,

    onSamplesPageChange,
}: {
    disableSharing?: boolean;
    disablePrint?: boolean;
    disableSave?: boolean;
    disabled?: boolean;
    samples: SampleResult[];
    run?: Run;
    setRun: (run: Run) => void;
    runUpsert: (run: Run) => Promise<Run>;
    onDelete?: () => void;

    // Samples pagination
    samplesPage?: number;
    samplesPageCount?: number;

    onSamplesPageChange?: (page: number) => void;
}) {
    const [formSaving, setFormSaving] = useState<boolean>(false);
    const [formSavedTime, setFormSavedTime] = useState<string | null>(null);
    const [showImportExportModal, setShowImportExportModal] = useState(false);
    const [errors, setErrors] = useRecoilState(errorsState);
    const [exportingSamples, setExportingSamples] = useState(false);

    const isCompleted = (run && run.status) === 'completed';

    if (!run) {
        run = {};
    }

    const updateSection = (section?: Section) => {
        if (section) {
            const currentSections = (run && run.sections) || [];
            setRun({...run, sections: currentSections.map(b => (b.definition.id === section.definition.id) ? section : b)});
        }
    };

    const syncRun = async (override?: Run) => {
        const newRun = Object.assign({}, run, override);
        newRun.status = calculateRunStatus(newRun);

        setFormSaving(true);
        try {
            return await runUpsert(newRun);
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
    const syncSection = (index: number) => (override?: Section) => {
        if (override) {
            const currentSections = (run && run.sections) || [];
            syncRun({
                sections: currentSections.map((s, i) => i === index ? override : s),
            })
        } else {
            syncRun();
        }
    }

    const exportSamples = useRecoilCallback(({ snapshot }) => async () => {
        setExportingSamples(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            if (!run || !run.id || !auth0Client) {
                return;
            }
            await exportRunSamples(() => auth0Client, run.id);
        } finally {
            setExportingSamples(false);
        }
    });

    return <>
        <ImportExportModal
            show={showImportExportModal}
            setShow={setShowImportExportModal}
            value={run}
            setData={setRun}
        />
        <Form className="mt-4 container">
            <DocumentTitle
                disableSharing={disableSharing}
                disablePrint={disablePrint}
                disabled={isCompleted || disabled}
                className="row"
                targetName="Run"
                targetPath={`run/${run.id}`}
                name={run.name || humanizeRunName(run)}
                setName={name => setRun({...run, name})}
                onDelete={onDelete}
                onImportExport={() => setShowImportExportModal(true)}
            />
            <br></br>
            <Form.Group>
                <Form.Label>Notes</Form.Label>
                <SlateInput
                    disabled={isCompleted || disabled}
                    value={run.notes ? deserializeSlate(run.notes) : initialSlateValue}
                    placeholder="Enter run notes here..."
                    onChange={notes => setRun({...run, notes: serializeSlate(notes || initialSlateValue)})}
                />
            </Form.Group>
            {run.sections && run.sections.map((section, i) => {
                if (!section || !section.definition || !section.definition.id) {
                    return undefined;
                }
                return <RunSectionEditor
                    key={section.definition.id}
                    disabled={disabled}
                    runId={(run && run.id) || -1}
                    index={i}
                    section={section}
                    setSection={updateSection}
                    syncSection={syncSection(i)}
                />
            })}

            <div className="row">
                <small className="col-auto my-auto">Samples (<i><Button variant="link" size="sm" onClick={exportSamples} disabled={exportingSamples}>Export to CSV {exportingSamples && <Spinner size="sm" animation="border" />}</Button></i>)</small>
                <hr className="col my-auto" />
                <small className="col-auto my-auto">
                    {(samples && samples.length) || 0}
                </small>
            </div>
            <ResultsTable results={samples || []} page={samplesPage} pageCount={samplesPageCount} onPageChange={onSamplesPageChange} />

            {!disableSave && !disabled && <div className="row">
                <SaveButton
                    className="col-auto ml-3"
                    onClick={() => syncRun()}
                    disabled={formSaving}
                    saving={formSaving}
                />
                <SavedIndicator
                    className="col-auto mr-auto my-auto"
                    savedOn={formSavedTime}
                />
            </div>}
        </Form>
    </>;
}
