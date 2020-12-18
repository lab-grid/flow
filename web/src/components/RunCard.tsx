import moment from "moment";
import React, { useState } from "react";
import { Button, Card } from "react-bootstrap";
import { ChevronUp, ChevronDown } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import { Run, RunStatus } from "../models/run";

function runStatusToVariant(status: RunStatus): string {
    switch (status) {
        case "todo":
            return "light";
        case "in-progress":
            return "info";
        case "completed":
            return "success";
    }
}

export function RunCard({className, run}: {
    className?: string;
    run: Run;
}) {
    const [showDetails, setShowDetails] = useState(false);

    return <Card className={className} bg={run.status && runStatusToVariant(run.status)}>
        <Card.Header>
            <span className="col my-auto">
                <Link to={`/run/${run.id}`}>{run.id}</Link> - (Protocol: <b>{run.protocol}</b>)
            </span>
            <Button className="col-auto my-auto" variant="outline-secondary" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? <ChevronUp /> : <ChevronDown />}
            </Button>
        </Card.Header>
        {showDetails && <Card.Body>
            {run.created_by && <div className="row">
                <span className="col">Owner:</span>
                <span className="col-auto">{run.created_by}</span>
            </div>}
            {run.created_by && <div className="row">
                <span className="col">Created On:</span>
                <span className="col-auto">{moment(run.created_on).format("LLLL")}</span>
            </div>}
            {run.updated_by && <div className="row">
                <span className="col">Last Editor:</span>
                <span className="col-auto">{run.updated_by}</span>
            </div>}
            {run.updated_by && <div className="row">
                <span className="col">Edited On:</span>
                <span className="col-auto">{moment(run.updated_on).format("LLLL")}</span>
            </div>}
        </Card.Body>}
    </Card>
}
