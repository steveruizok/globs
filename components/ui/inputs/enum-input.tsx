import { memo } from "react"
import { PropContainer } from "./shared"

interface Props {
  value: string | "mixed"
  label: string
  readOnly: boolean
  children: React.ReactNode
  onChange: (value: string) => void
}

function EnumInput({ children, value, label, readOnly, onChange }: Props) {
  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()
  }

  return (
    <PropContainer>
      <label htmlFor={label}>{label}</label>
      <select
        id={label}
        value={value}
        disabled={readOnly}
        onKeyDown={handleKeyDown}
        onChange={({ currentTarget: { value } }) => onChange(value)}
      >
        {value === "mixed" && (
          <option value="mixed" disabled>
            Mixed
          </option>
        )}
        {children}
      </select>
    </PropContainer>
  )
}

export default memo(EnumInput)
