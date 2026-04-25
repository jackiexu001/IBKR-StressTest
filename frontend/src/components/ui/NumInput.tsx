import { useState } from 'react'

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number
  onChange: (n: number) => void
}

const SPINNER_HIDE = '[appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden'

export function NumInput({ value, onChange, className = '', ...props }: Props) {
  const [s, setS] = useState(() => (value !== 0 ? String(value) : ''))
  const [lastExternal, setLastExternal] = useState(value)

  if (lastExternal !== value) {
    setLastExternal(value)
    const parsed = parseFloat(s)
    const matches = isNaN(parsed) ? value === 0 : Math.abs(parsed - value) < 1e-10
    if (!matches) setS(value !== 0 ? String(value) : '')
  }

  return (
    <input
      {...props}
      type="number"
      value={s}
      className={`${SPINNER_HIDE} ${className}`}
      onChange={e => {
        setS(e.target.value)
        const n = parseFloat(e.target.value)
        if (!isNaN(n)) onChange(n)
      }}
      onBlur={e => {
        const n = parseFloat(e.target.value)
        const final = isNaN(n) ? 0 : n
        setS(final !== 0 ? String(final) : '')
        onChange(final)
      }}
    />
  )
}
