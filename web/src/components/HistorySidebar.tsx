import React from "react";
import { Audited } from "../models/audited";
import { HistorySidebarCard } from "./HistorySidebarCard";

export function HistorySidebar<T extends Audited = Audited>({models, onSelect}: {
    models: T[];
    onSelect: (model: T) => void;
}) {
    return <div>
        {models.map(model => <HistorySidebarCard model={model} onSelect={onSelect} />)}
    </div>
}
