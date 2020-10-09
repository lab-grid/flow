import React from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValueLoadable } from 'recoil';
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { LoadableError } from '../components/LoadableError';
import { ProtocolBlockEditor } from '../components/ProtocolBlockEditor';
import { labflowOptions } from '../config';
import { Protocol } from '../models/protocol';
import { apiFetch } from '../state/api';
import { auth0State, protocolsState } from '../state/atoms';
import { protocolQuery } from '../state/selectors';

// Define a serializing function that takes a value and returns a string.
export function serializeSlate(value: Node[]): string{
    return (
        value
            // Return the string content of each paragraph in the value's children.
            .map(n => Node.string(n))
            // Join them all with line breaks denoting paragraphs.
            .join('\n')
    )
}

// Define a deserializing function that takes a string and returns a value.
export function deserializeSlate(str: string): Node[] {
    // Return a value array of children derived by splitting the string.
    return str.split('\n').map(line => {
        return {
            children: [{ text: line }],
        }
    })
}

export interface ProtocolEditorPageParams {
    id: string;
}

export function ProtocolEditorPage() {
    const editor = React.useMemo(() => withReact(createEditor()), []);

    const { id } = useParams<ProtocolEditorPageParams>();

    const protocolLoadable = useRecoilValueLoadable(protocolQuery(parseInt(id)));
    const protocolUpsert = useRecoilCallback(({ set, snapshot }) => async (protocol: Protocol) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        const method = protocol.id ? "PUT" : "POST";
        const path = protocol.id ? `protocol/${protocol.id}` : "protocol";
        const created: Protocol = await apiFetch(labflowOptions, () => auth0Client, method, path, protocol);
        set(protocolsState, state => {
            if (created.id) {
                state.protocolCache.set(created.id, created);
                return state;
            } else {
                throw new Error("Received a protocol without an ID from server!");
            }
        });
    });

    switch (protocolLoadable.state) {
        case "hasValue":
            return (
                <Form>
                    <Form.Group controlId="formProtocolTitle">
                        <Form.Label>Protocol Title</Form.Label>
                        <Form.Control type="text" />
                    </Form.Group>
                    <Slate
                        editor={editor}
                        value={(protocolLoadable.contents && protocolLoadable.contents.description) ? deserializeSlate(protocolLoadable.contents.description) : []}
                        onChange={newValue => protocolUpsert({ ...protocolLoadable.contents, description: serializeSlate(newValue) })}
                    >
                        <Editable />
                    </Slate>

                    {
                        protocolLoadable.contents &&
                        protocolLoadable.contents.blocks &&
                        protocolLoadable.contents.blocks.map(block => <ProtocolBlockEditor
                            block={block}
                            setBlock={block => {
                                if (protocolLoadable.contents && block) {
                                    const blocks = (protocolLoadable.contents.blocks || []).map(b => (b.id === block.id) ? block : b);
                                    protocolUpsert({ ...protocolLoadable.contents, blocks });
                                }
                            }}
                        />)
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
