import React from 'react';
import { Card, Form, InputGroup } from 'react-bootstrap';
import { Parser } from 'hot-formula-parser';
import { BlockVariable } from '../models/block-definition';


export interface CalculatorProps {
    disabled?: boolean;
    formula?: string;
    variables?: BlockVariable[];
    name?: string;
}

export function Calculator(props: CalculatorProps) {
    const [values, setValues] = React.useState<{[variable: string]: number}>({});
    const parser = new Parser();
    for (const [field, value] of Object.entries(values)) {
        if (field) {
            parser.setVariable(field, value);
        }
    }
    const evaluatedFormula = props.formula && parser.parse(props.formula);

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
                    <InputGroup.Append>
                        <InputGroup.Text> = {evaluatedFormula && (evaluatedFormula.error || evaluatedFormula.result)}</InputGroup.Text>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>
            {props.variables && props.variables.filter(variable => variable.name).map((variable, i) => <Form.Group key={variable.id}>
                <InputGroup>
                    <Form.Control
                        type="number"
                        disabled={props.disabled}
                        placeholder={`${(props.variables && props.variables[i] && props.variables[i].defaultValue) || 0}`}
                        value={values[variable.name] || 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newValues = {...values};
                            newValues[variable.name] = parseInt((e.target as HTMLInputElement).value);
                            setValues(newValues);
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
