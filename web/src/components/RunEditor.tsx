import moment from "moment";
import React, { useState } from "react";
import { Form } from "react-bootstrap";
import { useRecoilState, useRecoilValue } from "recoil";
import { Run, Section, calculateRunStatus, humanizeRunName } from "../models/run";
import { SampleResult, exportSampleResultsToCSV } from "../models/sample-result";
import { deserializeSlate, initialSlateValue, serializeSlate } from "../slate";
import { FetchError, getRunSamples } from "../state/api";
import { auth0State, errorsState } from "../state/atoms";
import { DocumentTitle } from "./DocumentTitle";
import { ResultsTable } from "./ResultsTable";
import { RunSectionEditor } from "./RunSectionEditor";
import { SaveButton } from "./SaveButton";
import { SavedIndicator } from "./SavedIndicator";
import { SlateInput } from "./SlateInput";

export function RunEditor({disableSharing, disableDelete, disablePrint, disableSave, samples, run, setRun, runUpsert, onDelete, samplesPage, samplesPageCount, onSamplesPageChange}: {
    disableSharing?: boolean;
    disableDelete?: boolean;
    disablePrint?: boolean;
    disableSave?: boolean;
    samples: SampleResult[];
    run?: Run;
    setRun: (run: Run) => void;
    runUpsert: (run: Run) => Promise<Run>;
    onDelete: () => void;

    // Samples pagination
    samplesPage?: number;
    samplesPageCount?: number;

    onSamplesPageChange?: (page: number) => void;
}) {
    const [formSaving, setFormSaving] = useState<boolean>(false);
    const [formSavedTime, setFormSavedTime] = useState<string | null>(null);
    const [errors, setErrors] = useRecoilState(errorsState);

    // For samples export.
    const { auth0Client } = useRecoilValue(auth0State);

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

    const syncRun = (override?: Run) => {
        const newRun = Object.assign({}, run, override);
        newRun.status = calculateRunStatus(newRun);

        setFormSaving(true);
        try {
            return runUpsert(newRun);
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

    const exportSamples = async () => {
        if (!run || !run.id || auth0Client) {
            return;
        }
        const samples = await getRunSamples(() => auth0Client, run.id);
        if (!samples || !samples.samples) {
            alert('No samples were found to be exported!');
            return;
        }
        exportSampleResultsToCSV(`export-sample-results-${moment().format()}.csv`, samples.samples, true);
    };

    return <>
        <Form className="mt-4 container">
            <DocumentTitle
                disableSharing={disableSharing}
                disableDelete={disableDelete}
                disablePrint={disablePrint}
                className="row"
                targetName="Run"
                targetPath={`/run/${run.id}`}
                name={humanizeRunName(run)}
                onDelete={onDelete}
            />
            <br></br>
            <Form.Group>
                <Form.Label>Notes</Form.Label>
                <SlateInput
                    disabled={isCompleted}
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
            <ResultsTable results={samples || []} page={samplesPage} pageCount={samplesPageCount} onPageChange={onSamplesPageChange} />

            {!disableSave && <div className="row">
                <SaveButton
                    className="col-auto ml-3"
                    onClick={() => syncRun()}
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
