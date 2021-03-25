import { PropContainer } from "./shared"

interface Props {
  value: string | "mixed"
  label: string
  children: React.ReactNode
  onChange: (value: string) => void
}

export default function EnumProp({ children, value, label, onChange }: Props) {
  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()
  }

  return (
    <PropContainer>
      <label>{label}</label>
      <select
        value={value}
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
