import React from "react";
import { Button, Spinner } from "react-bootstrap";

export function SaveButton({className, onClick, disabled, saving}: {
    className?: string;
    onClick: () => void;
    disabled?: boolean;
    saving?: boolean;
}) {
    return <Button
        className={className}
        variant="primary"
        onClick={onClick}
        disabled={disabled}
    >
        {
            saving
                ? <><Spinner size="sm" animation="border" /> Saving...</>
                : <>Save</>
        }
    </Button>;
}
