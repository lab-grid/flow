import React from "react";
import { DropTargetMonitor, XYCoord, useDrop, useDrag, DragSourceMonitor } from "react-dnd";

export interface DragItem {
    type: string;
    index: number;
}

export interface DragResult {
    isDragging: boolean;
}

export function hover(ref: React.RefObject<HTMLDivElement>, index: number, moveBlock: (dragIndex: number, hoverIndex: number) => void) {
    return (item: DragItem, monitor: DropTargetMonitor) => {
        if (!ref.current || item.index === index) {
            return;
        }

        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

        if (item.index < index && hoverClientY < hoverMiddleY) {
            // Dragging downwards
            return;
        }
        if (item.index > index && hoverClientY > hoverMiddleY) {
            // Dragging upwards
            return;
        }

        // Time to actually perform the action
        moveBlock(item.index, index);
        item.index = index;
    }
}

export function Draggable({children, index, type, move}: {
    children?: React.ReactNode;

    index: number;
    type: string;
    move: (dragIndex: number, hoverIndex: number) => void;
}) {
    const ref = React.useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({ accept: type, hover: hover(ref, index, move) });
    const [{ isDragging }, drag] = useDrag<DragItem, unknown, DragResult>({
        item: { type, index },
        collect: (monitor: DragSourceMonitor) => ({ isDragging: monitor.isDragging() }),
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));
    return (
        <div ref={ref} style={{ opacity }} className="mt-5 mb-5">
            {children}
        </div>
    );
}
