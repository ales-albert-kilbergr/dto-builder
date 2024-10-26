export function deepClone<V>(input: V): V {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  if (input instanceof Date) {
    return new Date(input.getTime()) as V;
  } else if (input instanceof RegExp) {
    return new RegExp(input.source, input.flags) as V;
  } else if (Array.isArray(input)) {
    return input.map((item) =>
      typeof item === 'object' ? deepClone(item) : item,
    ) as V;
  } else if (input instanceof Set) {
    const clone = new Set();

    for (const item of input) {
      clone.add(typeof item === 'object' ? deepClone(item) : item);
    }

    return clone as V;
  } else if (input instanceof Map) {
    const clone = new Map();

    for (const [mapKey, mapValue] of input) {
      clone.set(
        mapKey,
        typeof mapValue === 'object' ? deepClone(mapValue) : mapValue,
      );
    }

    return clone as V;
  } else if (typeof input === 'object') {
    const clone = {} as V;

    for (const key in input) {
      const value = input[key];

      if (typeof value === 'function') {
        throw new TypeError('Cannot clone DTO with functions');
      }

      clone[key] = typeof value === 'object' ? deepClone(value) : value;
    }

    return clone;
  } else {
    return input;
  }
}
