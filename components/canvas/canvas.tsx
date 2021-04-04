import * as vec from "lib/vec"
import styled from "styled-components"
import { useEffect, useRef } from "react"
import state, { mvPointer } from "lib/state"
import { IBounds, INode } from "lib/types"
import engine from "./Engine"
import { throttle } from "lib/utils"
import usePreventZoom from "hooks/usePreventZoom"

export default function Canvas() {
  const rContainer = useRef<HTMLDivElement>(null)

  usePreventZoom(rContainer)

  useEffect(() => {
    engine.mount(rContainer.current)

    // function handleResize() {
    //   engine.updateFromState(state)
    // }

    // const unsubFromUpdates = state.onUpdate((update) => {
    //   engine.render()
    // })

    // handleResize()
    // window.addEventListener("resize", handleResize)

    return () => {
      // unsubFromUpdates()
      engine.unmount()
      // window.removeEventListener("resize", handleResize)
    }
  }, [state])

  return <Container ref={rContainer} tabIndex={-1}></Container>
}

const Container = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;

  & canvas {
    position: fixed;
    left: 0;
    top: 0;
  }
`

const colors = {
  text: "#000",
  outline: "#000",
}
