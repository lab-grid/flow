import React, { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import * as xlsx from 'xlsx';

export function getHeadersFromData(data: tableRow[]): cellHeader[] {
    if (!data.length) {
        return [];
    }
    return Array.isArray(data) ? Array.from({length: data.length},(v,k)=>k+1) : Object.keys(data[0]);
}

export interface TableUploadModalProps<T={[field: string]: any}> {
    columns: {[column: string]: cellHeader | null};
    parseHeader?: boolean;
    show: boolean;
    setShow: (show: boolean) => void;
    setTable: (data: T[]) => void;
}

type cellHeader = string | number;
type cellData = string | number;
type objectRow = {[column: string]: cellData};
type arrayRow = cellData[]
type tableRow = objectRow | arrayRow;

export function TableUploadModal<T={[field: string]: any}>(props: TableUploadModalProps<T>) {
    const [sheetName, setSheetName] = useState("");
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [headers, setHeaders] = useState<cellHeader[]>([]);
    const [workbook, setWorkbook] = useState<xlsx.WorkBook | null>(null);
    const [data, setData] = useState<tableRow[] | null>(null);
    const [columnHeaders, setColumnHeaders] = useState(new Map<string, cellHeader | null>(Object.entries(props.columns)));

    const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0]
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev: any) => {
                const data = new Uint8Array(ev.target.result as ArrayBuffer);
                const workbook = xlsx.read(data, { type: 'array', codepage: 65001 });
                setWorkbook(workbook);
                setSheetNames(workbook.SheetNames);
                if (workbook.SheetNames && workbook.SheetNames.length) {
                    setSheetName(workbook.SheetNames[0]);
                    const data = xlsx.utils.sheet_to_json<{[column: string]: any}>(workbook.Sheets[workbook.SheetNames[0]], {
                        header: props.parseHeader ? undefined : 1
                    });
                    setData(data);
                    setHeaders(getHeadersFromData(data));
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };
    const switchSheet = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (workbook) {
            const sheetName = (e.target as HTMLInputElement).value
            setSheetName(sheetName);
            const data = xlsx.utils.sheet_to_json<{[column: string]: any}>(workbook.Sheets[sheetName]);
            setData(data);
            setHeaders(getHeadersFromData(data));
        }
    }
    const setColumnHeader = (column: string) => (header: string) => {
        const newColumnHeaders = new Map(columnHeaders);
        newColumnHeaders.set(column, header);
        setColumnHeaders(newColumnHeaders);
    };
    const importTable = () => {
        if (data) {
            const result: T[] = data.map((d: any) => {
                const obj = {} as any;
                for (const column of Object.keys(props.columns)) {
                    const header = columnHeaders.get(column);
                    if (header !== undefined && header !== null) {
                        obj[column] = d[typeof header === 'number' ? header - 1 : header];
                    }
                }
                return obj;
            });
            props.setTable(result);
        }
    };

    return <Modal show={props.show} onHide={props.setShow} size="lg" animation={false}>
        <Modal.Header closeButton>
            <Modal.Title>Upload Spreadsheet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form className="row">
                <Form.Group controlId="fileUpload" className="col">
                    <Form.File
                        label="Upload a file"
                        onChange={uploadFile}
                        // value={file}
                    />
                </Form.Group>
                <Form.Group controlId="sheetName" className="col">
                    <Form.Label>Sheet Name</Form.Label>
                    <Form.Control as="select" value={sheetName} onChange={switchSheet}>
                        {sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </Form.Control>
                </Form.Group>
            </Form>
            <Form className="row">
                {
                    Object.entries(props.columns).map(([column, columnDefault]) => 
                        <Form.Group controlId="newMethod" className="col" key={column}>
                            <Form.Label>'{column}' Column</Form.Label>
                            <Form.Control
                                as="select"
                                value={columnHeaders.get(column) || columnDefault || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColumnHeader(column)((e.target as HTMLInputElement).value)}
                            >
                                {headers.map(header => <option key={`${column}-${header}`} value={header}>{header}</option>)}
                            </Form.Control>
                        </Form.Group>
                    )
                }
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="primary" onClick={importTable}>
                Import
            </Button>
            <Button variant="secondary" onClick={() => props.setShow(false)}>
                Close
            </Button>
        </Modal.Footer>
    </Modal>
}
