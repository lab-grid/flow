import moment from "moment";
import React from "react";
import { Button, Form, InputGroup } from "react-bootstrap";


export function SignatureEditor({className, disabled, label, signature, signedOn, onSign, onUnsign}: {
    className?: string;
    disabled?: boolean;
    label?: string;
    signature?: string;
    signedOn?: string;
    onSign: () => void;
    onUnsign: () => void;
}) {
    return <Form.Group className={className}>
        {label && <Form.Label>{label}</Form.Label>}
        <InputGroup>
            <Form.Control
                className="flow-signature"
                type="text"
                value={signature || ""}
                disabled={true}
            />
            <InputGroup.Append>
                <Button variant="secondary" disabled={disabled} onClick={() => {
                    if (signedOn) {
                        onUnsign();
                    } else {
                        onSign();
                    }
                }}>
                    {signedOn ? 'Un-sign' : 'Sign'}
                </Button>
            </InputGroup.Append>
        </InputGroup>
        {
            signedOn && <div>
                Signed On: {moment(signedOn).format('LLLL')}
            </div>
        }
    </Form.Group>;
}
