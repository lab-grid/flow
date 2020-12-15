import moment from "moment";
import React from "react";
import { Button, Card } from "react-bootstrap";
import { Fullscreen } from "react-bootstrap-icons";
import { Audited } from "../models/audited";

export function HistorySidebarCard<T extends Audited = Audited>({model, onSelect}: {
    model: T;
    onSelect: (model: T) => void;
}) {
    return <Card>
        <Card.Title>{moment(model.updated_on).format("LLLL")}</Card.Title>
        <Card.Body className="row">
            <div className="col my-auto">
                {model.updated_by} made an edit {moment(model.updated_on).fromNow()}
            </div>
            <Button className="col-auto my-auto" onClick={() => onSelect(model)}>
                <Fullscreen />
            </Button>
        </Card.Body>
    </Card>;
}
