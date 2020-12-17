import moment from "moment";
import React, { useState } from "react";
import { Button, Card } from "react-bootstrap";
import { ChevronUp, ChevronDown } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import { Protocol } from "../models/protocol";

export function ProtocolCard({protocol}: {
    protocol: Protocol;
}) {
    const [showDetails, setShowDetails] = useState(false);

    return <Card>
        <Card.Header>
            <span className="col my-auto">
                <Link to={`/protocol/${protocol.id}`}>{protocol.id}</Link> - <b>{protocol.name}</b>
            </span>
            <Button className="col-auto my-auto" variant="outline-secondary" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? <ChevronUp /> : <ChevronDown />}
            </Button>
        </Card.Header>
        {showDetails && <Card.Body>
            {protocol.created_by && <div className="row">
                <span className="col">Owner:</span>
                <span className="col-auto">{protocol.created_by}</span>
            </div>}
            {protocol.created_by && <div className="row">
                <span className="col">Created On:</span>
                <span className="col-auto">{moment(protocol.created_on).format("LLLL")}</span>
            </div>}
            {protocol.updated_by && <div className="row">
                <span className="col">Last Editor:</span>
                <span className="col-auto">{protocol.updated_by}</span>
            </div>}
            {protocol.updated_by && <div className="row">
                <span className="col">Edited On:</span>
                <span className="col-auto">{moment(protocol.updated_on).format("LLLL")}</span>
            </div>}
        </Card.Body>}
    </Card>
}
