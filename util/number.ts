function intFromValue(
  sourceValue?: string | number | boolean,
  radix: number = 10
): number | undefined {
  let parsedInteger: number = NaN

  if (typeof sourceValue === 'undefined') return sourceValue
  if (typeof sourceValue === 'boolean') return sourceValue ? 1 : 0
  if (typeof sourceValue === 'number') parsedInteger = sourceValue
  if (typeof sourceValue === 'string')
    parsedInteger = parseInt(sourceValue, radix)

  return isNaN(parsedInteger) ? undefined : parsedInteger
}

export { intFromValue }
