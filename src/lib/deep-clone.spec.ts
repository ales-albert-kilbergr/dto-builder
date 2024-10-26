import { deepClone } from './deep-clone';

describe('(Unit) deepClone', () => {
  it('should copy a simple object', () => {
    // Arrange
    const obj = { foo: 'bar' };
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(clone).not.toBe(obj);
    expect(clone).toEqual(obj);
  });

  it('should copy a nested object', () => {
    // Arrange
    const obj = { foo: { bar: 'baz' } };
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(clone.foo).not.toBe(obj.foo);
    expect(clone).toEqual(obj);
  });

  it('should copy a date object', () => {
    // Arrange
    const obj = { foo: new Date() };
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(clone.foo).not.toBe(obj.foo);
    expect(clone).toEqual(obj);
  });

  it('should copy a regex object', () => {
    // Arrange
    const obj = { foo: /bar/ };
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(clone.foo).not.toBe(obj.foo);
    expect(clone).toEqual(obj);
  });

  it('should copy a set object', () => {
    // Arrange
    const obj = { foo: new Set(['bar']) };
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(clone.foo).not.toBe(obj.foo);
    expect(clone).toEqual(obj);
  });

  it('should copy a map object', () => {
    // Arrange
    const obj = { foo: new Map([['bar', 'baz']]) };
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(clone.foo).not.toBe(obj.foo);
    expect(clone).toEqual(obj);
  });

  it('should copy an array object', () => {
    // Arrange
    const obj = { foo: ['bar'] };
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(clone.foo).not.toBe(obj.foo);
    expect(clone).toEqual(obj);
  });

  it('should copy an array of objects', () => {
    // Arrange
    const obj = { foo: [{ bar: 'baz' }] };
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(clone.foo[0]).not.toBe(obj.foo[0]);
    expect(clone).toEqual(obj);
  });

  it('should copy an array of mixed objects', () => {
    // Arrange
    const obj = { foo: [{ bar: 'baz' }, 'qux'] };
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(clone.foo[0]).not.toBe(obj.foo[0]);
    expect(clone).toEqual(obj);
  });

  it('should copy an array in a set', () => {
    // Arrange
    const obj = { foo: new Set([['bar']]) };
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(Array.from(clone.foo)[0]).not.toBe(Array.from(obj.foo)[0]);
    expect(clone).toEqual(obj);
  });

  it('should fail to copy an object with a function', () => {
    // Arrange
    const obj = {
      foo: () => {
        /* noop */
      },
    };
    // Act
    const act = () => deepClone(obj);
    // Assert
    expect(act).toThrow(TypeError);
  });

  it('should return a primitive value as is', () => {
    // Arrange
    const obj = 'foo';
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(clone).toBe(obj);
  });

  it('should copy an array in a map', () => {
    // Arrange
    const obj = { foo: new Map([['bar', ['baz']]]) };
    // Act
    const clone = deepClone(obj);
    // Assert
    expect(clone.foo.get('bar')).not.toBe(obj.foo.get('bar'));
    expect(clone).toEqual(obj);
  });
});
