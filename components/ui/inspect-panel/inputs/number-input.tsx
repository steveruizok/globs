import { motion, PanInfo } from "framer-motion"
import { clamp } from "lib/utils"
import React, { memo, useRef, useState } from "react"
import { PropContainer } from "./shared"

interface Props {
  value: number | "mixed"
  label: string
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
}

function NumberInput({ min, max, step, value, label, onChange }: Props) {
  const rInput = useRef<HTMLInputElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  let rPanStart = useRef(Math.round(Number(value) * 100) / 100)

  function handlePan(_: PointerEvent, info: PanInfo) {
    if (!isFocused && value !== "mixed") {
      rPanStart.current += info.delta.x
      const next = Math.round(Number(rPanStart.current) * 100) / 100
      onChange(min !== undefined ? clamp(next, min, max) : next)
    }
  }

  function handleChange({
    currentTarget: { value },
  }: React.ChangeEvent<HTMLInputElement>) {
    const next = Math.round(Number(value) * 100) / 100
    onChange(min !== undefined ? clamp(next, min, max) : next)
  }

  function handleTap() {
    if (isHovered) {
      setIsFocused(true)
      rInput.current!.focus()
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(false)
    if (value !== "mixed") handleChange(e)
  }

  return (
    <PropContainer>
      <label style={{ pointerEvents: "none" }}>{label}</label>
      <motion.div
        className="dragWrapper"
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onPanStart={handlePanStart}
        onPanEnd={handlePanEnd}
        onPan={handlePan}
        onTap={handleTap}
      >
        <input
          ref={rInput}
          type="number"
          value={value || 0}
          min={min}
          max={max}
          step={step}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{ pointerEvents: isFocused ? "all" : "none" }}
        />
      </motion.div>
    </PropContainer>
  )
}

export default memo(NumberInput)

function handlePanStart() {
  document.body.style.cursor = "ew-resize"
}

function handlePanEnd() {
  document.body.style.cursor = "default"
}

function handleKeyDown(e: React.KeyboardEvent) {
  e.stopPropagation()
}
