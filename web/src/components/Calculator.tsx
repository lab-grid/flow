import React from 'react';
import { Card, Form, InputGroup } from 'react-bootstrap';

export interface CalculatorFormula {
    name?: string;
    formula?: string;
    variables?: string[];
    defaults?: number[];
}

export interface CalculatorProps {
    disabled?: boolean;
    formula?: CalculatorFormula;
}

export function Calculator(props: CalculatorProps) {
    const [values, setValues] = React.useState<{[variable: string]: number}>({});

    return <Card>
        {name && <Card.Title>{name}</Card.Title>}
        <Card.Body>
            <div className="row">Formula: {props.formula && props.formula.formula} = ?</div>
            {props.formula && props.formula.variables && props.formula.variables.map((variable, i) => <InputGroup key={variable}>
                <InputGroup.Prepend>
                    {variable} = 
                </InputGroup.Prepend>
                <Form.Control
                    type="number"
                    disabled={props.disabled}
                    placeholder={`${(props.formula && props.formula.variables && props.formula.variables[i]) || 0}`}
                    value={values[variable] || 0}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newValues = {...values};
                        newValues[variable] = parseInt((e.target as HTMLInputElement).value);
                        setValues(newValues);
                    }}
                />
            </InputGroup>)}
        </Card.Body>
    </Card>
}
