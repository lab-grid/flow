import React from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useRecoilValueLoadable } from 'recoil';
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { LoadableError } from '../components/LoadableError';
import { ProtocolBlockEditor } from '../components/ProtocolBlockEditor';
import { protocolQuery } from '../state/selectors';

export interface ProtocolEditorPageParams {
    id: string;
}

export function ProtocolEditorPage() {
    const editor = React.useMemo(() => withReact(createEditor()), []);
    const [description, setDescription] = React.useState<Node[]>([]);

    const { id } = useParams<ProtocolEditorPageParams>();

    const protocolLoadable = useRecoilValueLoadable(protocolQuery(parseInt(id)));

    switch (protocolLoadable.state) {
        case "hasValue":
            return (
                <Form>
                    <Form.Group controlId="formProtocolTitle">
                        <Form.Label>Protocol Title</Form.Label>
                        <Form.Control type="text" />
                    </Form.Group>
                    <Slate editor={editor} value={description} onChange={newValue => setDescription(newValue)}>
                        <Editable />
                    </Slate>

                    {
                        protocolLoadable.contents &&
                        protocolLoadable.contents.blocks &&
                        protocolLoadable.contents.blocks.map(block => <ProtocolBlockEditor block={block} />)
                    }
                </Form>
            );
        case "hasError":
            return (
                <LoadableError error={protocolLoadable.contents} />
            );
        case "loading":
            return (
                <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                />
            );
    }
}
