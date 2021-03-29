import state, { useSelector } from "lib/state"
import NodeListItem from "./node-list-item"
import { Menu } from "react-feather"
import {
  DragDropContext,
  Droppable,
  Draggable,
  DraggingStyle,
  NotDraggingStyle,
  DropResult,
} from "react-beautiful-dnd"
import { Handle } from "./shared"
import { useCallback } from "react"

const getItemStyle = (
  isDragging: boolean,
  draggableStyle: DraggingStyle | NotDraggingStyle
) => {
  const { transform } = draggableStyle
  let activeTransform = {}
  if (transform) {
    activeTransform = {
      transform: `translate(0, ${transform.substring(
        transform.indexOf(",") + 1,
        transform.indexOf(")")
      )})`,
    }
  }
  return {
    userSelect: "none" as any,
    ...draggableStyle,
    ...activeTransform,
  }
}

export default function NodeList() {
  const nodeIds = useSelector((s) => s.data.nodeIds)
  const selectedNodeIds = useSelector((s) => s.data.selectedNodes)

  const handleDragEnd = useCallback(
    (result: DropResult) =>
      state.send("MOVED_NODE_ORDER", {
        id: result.draggableId,
        from: result.source.index,
        to: result.destination.index,
        reason: result.reason,
      }),
    []
  )

  return (
    <section>
      <h2>Nodes</h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable">
          {(provided, snapshot) => (
            <ol {...provided.droppableProps} ref={provided.innerRef}>
              {nodeIds.map((id, i) => (
                <Draggable key={id} draggableId={id} index={i}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={getItemStyle(
                        snapshot.isDragging,
                        provided.draggableProps.style
                      )}
                    >
                      <Handle data-hidey {...provided.dragHandleProps}>
                        <Menu />
                      </Handle>
                      <NodeListItem
                        key={id}
                        id={id}
                        selected={selectedNodeIds.includes(id)}
                      />
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ol>
          )}
        </Droppable>
      </DragDropContext>
    </section>
  )
}
