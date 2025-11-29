export interface DroppableRenderProps {
    setNodeRef: (element: HTMLElement | null) => void;
    isDropTarget: boolean;
}

export interface DroppableAreaProps {
    id: string;
    children: (props: DroppableRenderProps) => React.ReactNode;
}
