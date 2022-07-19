type ObjectWithId = {
  id: string
}

type IdResolvable = ObjectWithId | string

export function idForObject(obj: IdResolvable): string
export function idForObject(obj: IdResolvable | undefined): string | undefined
export function idForObject(obj: IdResolvable | undefined): string | undefined {
  if (typeof obj === 'undefined') return obj
  return typeof obj === 'string' ? obj : obj.id
}
