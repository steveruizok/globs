import { motion } from "framer-motion"
import { clamp } from "lib/utils"
import inputs from "lib/inputs"
import React, { memo, useEffect, useRef, useState } from "react"
import { PropContainer } from "./shared"

interface Props {
  value: number | "mixed"
  label: string
  min?: number
  max?: number
  step?: number
  onPanStart?: () => void
  onPanEnd?: () => void
  onChange: (value: number) => void
}

function NumberInput({
  min,
  max,
  step = 1,
  value,
  label,
  onPanStart,
  onPanEnd,
  onChange,
}: Props) {
  const rInput = useRef<HTMLInputElement>(null)
  const rPoint = useRef([0, 0])
  const [val, setVal] = useState(value === "mixed" ? 0 : value)
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  let rWillEdit = useRef(true)
  let rPanStart = useRef(Math.round(Number(val) * 100) / 100)

  useEffect(() => {
    rPanStart.current = Math.round(Number(val) * 100) / 100
  }, [val])

  useEffect(() => {
    if (value !== val) {
      setVal(value === "mixed" ? 0 : value)
    }
  }, [value])

  function handlePointerDown() {
    rPoint.current = inputs.pointer.point
    setIsPressed(true)
  }

  function handleEnd() {
    onPanEnd && onPanEnd()
    setIsPressed(false)
    setIsPanning(false)

    window.removeEventListener("pointerup", handleEnd)
  }

  function handePointerMove(e) {
    if (
      isPressed &&
      !isPanning &&
      Math.abs(inputs.pointer.point[0] - rPoint.current[0]) > 3
    ) {
      setIsPanning(true)
      onPanStart && onPanStart()

      window.addEventListener("pointerup", handleEnd)
      e.preventDefault()
      e.stopPropagation()
    }

    if (isPanning) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  function handlePointerUp() {
    setIsPressed(false)
    setIsPanning(false)
    rInput.current.focus()
  }

  // function handlePan(_: PointerEvent, info: PanInfo) {
  //   if (!isFocused && value !== "mixed") {
  //     state.send("TRANSLATED")
  //     const clamped = max !== undefined && min !== undefined
  //     rPanStart.current += info.delta.x * (clamped ? (max - min) / 100 : 1)
  //     const next = Math.round(Number(rPanStart.current) * 100) / 100
  //     setVal(next)
  //     onChange(min !== undefined ? clamp(next, min, max) : next)
  //   }
  // }

  function handleChange({
    currentTarget: { value },
  }: React.ChangeEvent<HTMLInputElement>) {
    const next = Math.round(Number(value) * 100) / 100
    setVal(next)
  }

  function handleTap() {
    if (isHovered) {
      setIsFocused(true)
      rInput.current!.focus()
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (rWillEdit.current) {
      setIsFocused(false)
      if (value !== "mixed") {
        const next = Math.round(Number(val) * 100) / 100
        onChange(min !== undefined ? clamp(next, min, max) : next)
      }
    } else {
      setVal(value === "mixed" ? 0 : value)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()
    if (e.key === "Escape") {
      rWillEdit.current = false
      rInput.current.blur()
    } else if (e.key === "Enter") {
      rInput.current.blur()
    }
  }

  function handleFocus() {
    rWillEdit.current = true
  }

  return (
    <PropContainer>
      <label style={{ pointerEvents: "none" }}>{label}</label>
      <motion.div
        className="dragWrapper"
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handePointerMove}
        onTap={handleTap}
      >
        <input
          ref={rInput}
          type="number"
          value={val}
          min={min}
          max={max}
          step={step}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{ pointerEvents: isFocused ? "all" : "none" }}
        />
      </motion.div>
    </PropContainer>
  )
}

export default memo(NumberInput)

function handlePanEnd() {
  document.body.style.cursor = "default"
}
