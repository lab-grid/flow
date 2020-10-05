import React from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { useRecoilValueLoadable } from 'recoil';
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { LoadableError } from '../components/LoadableError';
import { RunBlockEditor } from '../components/RunBlockEditor';
import { runsQuery } from '../state/selectors';

export function RunEditorPage() {
    const editor = React.useMemo(() => withReact(createEditor()), []);
    const [description, setDescription] = React.useState<Node[]>([]);

    const runsLoadable = useRecoilValueLoadable(runsQuery);

    switch (runsLoadable.state) {
        case "hasValue":
            return (
                <Form>
                    <Form.Group controlId="formRunTitle">
                        <Form.Label>Run Title</Form.Label>
                        <Form.Control type="text" />
                    </Form.Group>
                    <Slate editor={editor} value={description} onChange={newValue => setDescription(newValue)}>
                        <Editable />
                    </Slate>
            
                    {runsLoadable.contents.map(run => <RunBlockEditor run={run} />)}
                </Form>
            );
        case "hasError":
            return (
                <LoadableError error={runsLoadable.contents} />
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
