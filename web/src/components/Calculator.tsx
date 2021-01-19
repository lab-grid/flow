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

    const currentValues = props.values ? {...props.values} : {};
    for (const variable of (props.variables || [])) {
        if (!currentValues[variable.name]) {
            currentValues[variable.name] = variable.defaultValue || 0;
        }
    }

    let evaluatedFormula: any = undefined;
    // let formulaPretty: string | undefined = undefined;
    try {
        evaluatedFormula = compiledFormula && compiledFormula.evaluate(currentValues);
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
                        step="any"
                        disabled={props.disabled}
                        placeholder={`${(props.variables && props.variables[i] && props.variables[i].defaultValue) || "0"}`}
                        value={(props.values && props.values[variable.name]) || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newValues = {...currentValues};
                            newValues[variable.name] = parseFloat((e.target as HTMLInputElement).value);
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
