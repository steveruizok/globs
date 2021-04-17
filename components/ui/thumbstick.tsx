import { styled } from "stitches.config"
import { motion, useMotionValue } from "framer-motion"
import { memo, useCallback, useEffect, useRef } from "react"
import { throttle } from "lib/utils"
import state from "lib/state"
import inputs from "lib/inputs"
import * as vec from "lib/vec"

function Thumbstick() {
  const rStick = useRef<HTMLDivElement>(null)
  const mvX = useMotionValue(0)
  const mvY = useMotionValue(0)
  const rLooping = useRef(false)
  const rInterval = useRef(0)

  useEffect(() => {
    return () => {
      clearInterval(rInterval.current)
    }
  })

  const handleDragStart = useCallback(() => {
    let t: number
    function loop(e: number) {
      if (!rLooping.current) return

      if (t === undefined) {
        t = e
      }

      if (e - t < 16) {
        rInterval.current = requestAnimationFrame(loop)
        return
      }

      t = e

      const x = mvX.get() / 6
      const y = mvY.get() / 6

      handleMove(x, y)
      rInterval.current = requestAnimationFrame(loop)
    }

    rLooping.current = true
    loop(0)

    state.send("STARTED_MOVING_THUMBSTICK", {
      point: vec.add(
        state.data.document.point,
        vec.div(state.data.document.size, 2)
      ),
    })

    return () => {
      cancelAnimationFrame(rInterval.current)
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    rLooping.current = false
    cancelAnimationFrame(rInterval.current)
    state.send("STOPPED_MOVING_THUMBSTICK", { point: inputs.pointer.point })
  }, [])

  return (
    <Container>
      <Stick ref={rStick} />
      <Control
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onPointerUp={handleDragEnd}
        onPanEnd={handleDragEnd}
        onTouchEnd={handleDragEnd}
        onDragEnd={handleDragEnd}
        onTap={handleDragEnd}
        style={{ x: mvX, y: mvY }}
      />
    </Container>
  )
}

const Container = styled(motion.div, {
  position: "absolute",
  bottom: 0,
  right: 0,
  width: 128,
  height: 128,
  borderRadius: "100%",
  backgroundColor: "$panel",
  userSelect: "none",
  pointerEvents: "all",

  "@media (min-width: 768px)": {
    visibility: "hidden",
  },
})

const Stick = styled("div", {
  position: "absolute",
  bottom: 40,
  right: 40,
  width: 44,
  height: 44,
  borderRadius: "100%",
  backgroundColor: "$selected",
  boxShadow:
    "inset 4px 4px 8px 2px rgba(0,0,0,.1), 2px 2px 2px 0px rgba(255, 255, 255, .09)",
  zIndex: 2,
})

const Control = styled(motion.div, {
  position: "absolute",
  pointerEvents: "all",
  width: 80,
  height: 80,
  left: 24,
  top: 24,
  borderRadius: "100%",
  backgroundColor: "$section",
  boxShadow:
    "4px 4px 8px 2px rgba(0,0,0,.1), inset 2px 2px 2px 0px rgba(255, 255, 255, .09)",
  zIndex: 3,
})

const handleMove = throttle((x: number, y: number) => {
  inputs.handleThumbstickMove(x, y)
  state.send("MOVED_THUMBSTICK")
}, 16)

export default memo(Thumbstick)
