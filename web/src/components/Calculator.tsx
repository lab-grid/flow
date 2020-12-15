import React from 'react';
import { Card, Form, InputGroup } from 'react-bootstrap';
import { math } from '../math';
import { BlockVariable } from '../models/block-definition';

export interface CalculatorProps {
    disabled?: boolean;
    formula?: string;
    variables?: BlockVariable[];
    name?: string;
    values?: {[variable: string]: number};
    setValues: (values?: {[variable: string]: number}) => void;
}

export function Calculator(props: CalculatorProps) {
    const parsedFormula = props.formula && math.parse && math.parse(props.formula);
    const compiledFormula = parsedFormula && parsedFormula.compile();

    let evaluatedFormula: any = undefined;
    // let formulaPretty: string | undefined = undefined;
    try {
        evaluatedFormula = compiledFormula && compiledFormula.evaluate(props.values || {});
        // formulaPretty = parsedFormula && parsedFormula.toHtml();
    } catch (ex) {
        evaluatedFormula = `ERROR: ${ex.message}`;
    }

    return <Card>
        {props.name && <Card.Title>{props.name}</Card.Title>}
        <Card.Body>
            <Form.Group>
                <InputGroup>
                    <Form.Control
                        type="text"
                        disabled={true}
                        value={props.formula}
                    />
                    {/* <Form.Text>
                        {formulaPretty && <div dangerouslySetInnerHTML={{__html: formulaPretty}} />}
                    </Form.Text> */}
                    <InputGroup.Append>
                        <InputGroup.Text> = {evaluatedFormula}</InputGroup.Text>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>
            {props.variables && props.variables.filter(variable => variable.name).map((variable, i) => <Form.Group key={variable.id}>
                <InputGroup>
                    <Form.Control
                        type="number"
                        disabled={props.disabled}
                        placeholder={`${(props.variables && props.variables[i] && props.variables[i].defaultValue) || 0}`}
                        value={(props.values && props.values[variable.name]) || 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newValues = props.values ? {...props.values} : {};
                            newValues[variable.name] = parseInt((e.target as HTMLInputElement).value);
                            props.setValues(newValues);
                        }}
                    />
                    <InputGroup.Append>
                        <InputGroup.Text>{variable.name}</InputGroup.Text>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>)}
        </Card.Body>
    </Card>
}
