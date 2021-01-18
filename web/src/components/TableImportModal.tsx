import React, { useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { useRecoilCallback } from 'recoil';
import { useModalTracking } from '../analytics';
import { labflowOptions } from '../config';
import { BlockResultsImport } from '../models/block-definition';
import { externalFetch } from '../state/api';
import { auth0State } from '../state/atoms';

export interface TableImportModalProps<T={[field: string]: any}> {
    url: string;
    method: string;
    params: string[];
    show: boolean;
    setShow: (show: boolean) => void;
    setTable: (data: T[], attachments: {[filename: string]: string}) => void;
}

export function TableImportModal<T={[field: string]: any}>(props: TableImportModalProps<T>) {
    useModalTracking("table-import");
    const [importing, setImporting] = useState(false);
    const [paramValues, setParamValues] = useState<{[param: string]: string}>({});

    const importTable = useRecoilCallback(({ snapshot }) => async () => {
        setImporting(true);
        try {
            let url = props.url;
            for (const [param, value] of Object.entries(paramValues)) {
                url = url.replaceAll(`:${param}`, value);
            }
            const { auth0Client } = await snapshot.getPromise(auth0State);
            const { results, attachments } = await externalFetch<BlockResultsImport<T>>(labflowOptions, () => auth0Client, props.method, url);
            props.setTable(results || [], attachments || {});
        } finally {
            setImporting(false);
        }
    });

    return <Modal show={props.show} onHide={props.setShow} size="lg" animation={false}>
        <Modal.Header closeButton>
            <Modal.Title>Import Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form>
                {props.params.filter(param => !!param).map(param =>
                    <Form.Group key={param}>
                        <Form.Label>{param}</Form.Label>
                        <Form.Control
                            type="text"
                            disabled={importing}
                            value={paramValues[param] || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newParamValues = { ...paramValues };
                                newParamValues[param] = (e.target as HTMLInputElement).value;
                                setParamValues(newParamValues);
                            }}
                        />
                    </Form.Group>
                )}
            </Form>
            {
                importing && <div className="d-flex mt-5">
                    <div className="col"></div>
                    <div className="col-auto mr-3 my-auto">
                        Importing...
                    </div>
                    <div className="col-auto">
                        <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                        />
                    </div>
                    <div className="col"></div>
                </div>
            }
        </Modal.Body>
        <Modal.Footer>
            <Button variant="primary" onClick={importTable} disabled={importing}>
                Import
            </Button>
            <Button variant="secondary" onClick={() => props.setShow(false)} disabled={importing}>
                Close
            </Button>
        </Modal.Footer>
    </Modal>
}
