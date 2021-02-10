import React from 'react';
import { Card, Form, InputGroup } from 'react-bootstrap';
import { math } from '../math';
import { VariableValue } from '../models/block';
import { BlockVariable } from '../models/block-definition';

export interface CalculatorProps {
    disabled?: boolean;
    formula?: string;
    formulaSigFigs?: number;
    variables?: BlockVariable[];
    name?: string;
    values?: VariableValue[];
    setValues: (values?: VariableValue[]) => void;
}

export function Calculator(props: CalculatorProps) {
    const parsedFormula = props.formula && math.parse && math.parse(props.formula);
    const compiledFormula = parsedFormula && parsedFormula.compile();

    const currentValues: {[id: string]: number} = {};
    const currentInputValues: {[id: string]: number} = {};
    const currentVariables: {[id: string]: BlockVariable} = {};
    for (const variable of (props.variables || [])) {
        currentValues[variable.name] = variable.defaultValue || 0;
        currentVariables[variable.id] = variable;
    }
    for (const variable of (props.values || [])) {
        if (!variable.id || variable.value === undefined) {
            continue
        }
        const varSchema = currentVariables[variable.id];
        currentValues[varSchema.name] = variable.value;
        currentInputValues[varSchema.name] = variable.value;
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
                        <InputGroup.Text> = {evaluatedFormula.toFixed(props.formulaSigFigs || 6)}</InputGroup.Text>
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
                        value={(currentInputValues[variable.name]) || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = parseFloat((e.target as HTMLInputElement).value);
                            const newValues = props.values ? [...props.values] : [];
                            let varFound = false;
                            for (let j = 0; j < newValues.length; j++) {
                                const varValue = newValues[j];
                                if (varValue.id === variable.id) {
                                    newValues[j] = {...newValues[j], value };
                                    varFound = true;
                                    break;
                                }
                            }
                            if (!varFound) {
                                newValues.push({
                                    id: variable.id,
                                    value,
                                });
                            }
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
