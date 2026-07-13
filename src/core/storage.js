export class Storage {
  constructor({ logger }) {
    this.logger = logger
  }

  setup() {
    return true
  }

  get(key) {
    if (!key) throw new Error("Storage key is null or undefined")

    const raw = localStorage.getItem(key)
    if (raw === null) return null

    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }

  set(key, value) {
    if (!key) throw new Error("Storage key is null or undefined")
    if (value === undefined) this.logger.warning(`Storage.set: "${key}" value is undefined, storing as null`)

    localStorage.setItem(key, JSON.stringify(value ?? null))
    return value
  }

  update(key, value) {
    if (!key) throw new Error("Storage key is null or undefined")

    const currentValue = this.get(key)
    if (currentValue === null) return this.set(key, value)

    const isMergeableObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v)

    const updatedValue = isMergeableObject(currentValue) && isMergeableObject(value) ? { ...currentValue, ...value } : value

    return this.set(key, updatedValue)
  }

  delete(key) {
    if (!key) throw new Error("Storage key is null or undefined")

    localStorage.removeItem(key)

    return true
  }

  has(key) {
    return this.get(key) !== null
  }

  clear() {
    localStorage.clear()

    return true
  }

  keys() {
    return Object.keys(localStorage)
  }

  getAll() {
    const result = {}
    for (const key of this.keys()) {
      result[key] = this.get(key)
    }

    return result
  }
}
