export function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text || undefined
}

export function toStringList(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
