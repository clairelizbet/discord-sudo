/**
 * Returns an int value if one can be parsed
 * from the given source value. If provided a float,
 * it returns the floor of the value (e.g. 1.9 → 1)
 */
function intFromValue(
  sourceValue?: string | number | boolean,
  radix: number = 10
): number | undefined {
  if (typeof sourceValue === 'undefined') return sourceValue
  if (typeof sourceValue === 'boolean') return sourceValue ? 1 : 0
  if (typeof sourceValue === 'number') return Math.floor(sourceValue)

  // Source is a string - we'll try to parse it, returning undefined if unable
  const parsedInteger: number = parseInt(sourceValue, radix)
  return isNaN(parsedInteger) ? undefined : parsedInteger
}

export { intFromValue }
