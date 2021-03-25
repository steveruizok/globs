import { useRef, useEffect } from "react"
import { PropContainer } from "./shared"

interface Props {
  value: boolean | "mixed"
  label: string
  onChange: (value: boolean) => void
}

export default function BoolProp({ value, label, onChange }: Props) {
  const rInput = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()
  }

  useEffect(() => {
    rInput.current!.indeterminate = value === "mixed"
  }, [value])

  return (
    <PropContainer>
      <label>{label}</label>
      <input
        ref={rInput}
        type="checkbox"
        checked={value === "mixed" ? true : value}
        onKeyDown={handleKeyDown}
        onChange={({ currentTarget: { checked } }) =>
          onChange(Boolean(checked))
        }
      />
    </PropContainer>
  )
}
