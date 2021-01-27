import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useModalTracking } from '../analytics';
import { JsonEditor } from 'jsoneditor-react';

export interface ImportExportModalProps<T=any> {
    value: T;
    show: boolean;
    setShow: (show: boolean) => void;
    setData: (data: T) => void;
}

export function ImportExportModal<T=any>(props: ImportExportModalProps<T>) {
    useModalTracking("table-import");
    const [value, setValue] = useState(props.value);

    return <Modal show={props.show} onHide={props.setShow} size="lg" animation={false}>
        <Modal.Header closeButton>
            <Modal.Title>Import/Export as JSON Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <JsonEditor
                value={value}
                onChange={(currentDoc: T) => setValue(currentDoc) }
                mode="code"
            />
        </Modal.Body>
        <Modal.Footer>
            <div>
                <b>WARNING:</b> Changing these values can corrupt data. Make sure you know what you're doing!
            </div>
            <div>
                <Button variant="primary" onClick={() => props.setData(value)}>
                    Import
                </Button>
                <Button variant="secondary" onClick={() => props.setShow(false)}>
                    Close
                </Button>
            </div>
        </Modal.Footer>
    </Modal>
}
