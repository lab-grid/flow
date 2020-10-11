import React from 'react';
import { Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
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

    const protocol = useRecoilValue(protocolQuery(parseInt(id)));
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

    return (
        <Form>
            <Form.Group controlId="formProtocolTitle">
                <Form.Label>Protocol Title</Form.Label>
                <Form.Control type="text" />
            </Form.Group>
            <Slate
                editor={editor}
                value={(protocol && protocol.description) ? deserializeSlate(protocol.description) : []}
                onChange={newValue => protocolUpsert({ ...protocol, description: serializeSlate(newValue) })}
            >
                <Editable />
            </Slate>

            {
                protocol &&
                protocol.blocks &&
                protocol.blocks.map(block => <ProtocolBlockEditor
                    block={block}
                    setBlock={block => {
                        if (protocol && block) {
                            const blocks = (protocol.blocks || []).map(b => (b.id === block.id) ? block : b);
                            protocolUpsert({ ...protocol, blocks });
                        }
                    }}
                />)
            }
        </Form>
    );
}
