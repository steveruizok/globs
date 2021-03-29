import state, { useSelector } from "lib/state"
import GlobListItem from "./glob-list-item"
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

export default function GlobList() {
  const globIds = useSelector((s) => s.data.globIds)

  const selected = useSelector((s) => s.data.selectedGlobs)

  const handleDragEnd = useCallback(
    (result: DropResult) =>
      state.send("MOVED_GLOB_ORDER", {
        id: result.draggableId,
        from: result.source.index,
        to: result.destination.index,
        reason: result.reason,
      }),
    []
  )
  return (
    <section>
      <h2>Globs</h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable" direction="vertical">
          {(provided, snapshot) => (
            <ol
              {...provided.droppableProps}
              ref={provided.innerRef}
              // style={getListStyle(snapshot.isDraggingOver)}
            >
              {globIds.map((id, i) => (
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
                      <GlobListItem
                        key={id}
                        id={id}
                        selected={selected.includes(id)}
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
