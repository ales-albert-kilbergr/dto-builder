import { createBuilder } from './dto-builder';
import { left, right } from 'fp-ts/Either';

describe('(Unit) Dto Builder', () => {
  describe('when accessing the dynamic getters and setters', () => {
    it('should expose setter and getter based on an interface', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const value = 'bar';
      // Act
      const builder = createBuilder<TestDto>();
      builder.setFoo(value);
      // Assert
      expect(builder.getFoo()).toBe(value);
    });

    it('should trigger a typescript error if the supplied value is not of the correct type', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const value = 42;
      // Act
      const builder = createBuilder<TestDto>();
      // Assert
      // @ts-expect-error - forcing a wrong value type
      builder.setFoo(value);
    });

    it('should allow to set undefined for nullable values', () => {
      // Arrange
      interface TestDto {
        foo?: string;
      }
      // Act
      const builder = createBuilder<TestDto>();
      builder.setFoo(undefined);
      // Assert
      expect(builder.getFoo()).toBeUndefined();
    });

    it('should fail if someone tries to access a symbol property on the builder', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      // Act
      const builder = createBuilder<TestDto>();
      // @ts-expect-error - forcing a symbol access
      const act = () => builder[Symbol('foo')];
      // Assert
      expect(act).toThrow(TypeError);
    });

    it('should throw an error if some other unexpected access attempt is made', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      // Act
      const builder = createBuilder<TestDto>();
      // @ts-expect-error - forcing an unexpected access
      const act = () => builder.foo;
      // Assert
      expect(act).toThrow(TypeError);
    });
  });

  describe('when cloning the builder', () => {
    it('should create a clone with already set values', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const value = 'bar';
      // Act
      const builder = createBuilder<TestDto>();
      builder.setFoo(value);
      const clone = builder.clone();
      // Assert
      expect(clone.getFoo()).toBe(value);
    });

    it('should set a new value to the clone but not to the original', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = createBuilder<TestDto>();
      builder.setFoo(value);
      const clone = builder.clone();
      clone.setFoo(newValue);
      // Assert
      expect(builder.getFoo()).toBe(value);
      expect(clone.getFoo()).toBe(newValue);
    });
  });

  describe('when extending the builder', () => {
    it('should extend the builder with new properties', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      interface ExtendedDto {
        bar: number;
      }
      const value = 'bar';
      const newValue = 42;
      // Act
      const builder = createBuilder<TestDto>();
      builder.setFoo(value);
      const extended = builder.extend<ExtendedDto>();
      extended.setBar(newValue);
      // Assert
      expect(extended.getFoo()).toBe(value);
      expect(extended.getBar()).toBe(newValue);
    });
  });

  describe('when building the DTO object', () => {
    it('should build the DTO object', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const value = 'bar';
      // Act
      const builder = createBuilder<TestDto>();
      builder.setFoo(value);
      const dto = builder.build();
      // Assert
      expect(dto).toEqual(right({ foo: value }));
    });
  });

  describe('when patching the DTO object', () => {
    it('should allow to patch the DTO object', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = createBuilder<TestDto>();
      builder.setFoo(value);
      const patched = builder.patch({ foo: newValue });
      // Assert
      expect(patched.getFoo()).toBe(newValue);
    });

    it('should only change the patched value', () => {
      // Arrange
      interface TestDto {
        foo: string;
        bar: number;
      }
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = createBuilder<TestDto>();
      builder.setFoo(value).setBar(42);
      builder.patch({ foo: newValue });
      // Assert
      expect(builder.build()).toEqual(right({ foo: newValue, bar: 42 }));
    });
  });

  describe('when adding an array value', () => {
    it('should allow to add a value to an array', () => {
      // Arrange
      interface TestDto {
        foo: string[];
      }
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = createBuilder<TestDto>();
      builder.setFoo([value]);
      builder.addFoo(newValue);
      // Assert
      expect(builder.getFoo()).toEqual([value, newValue]);
    });

    it('should automatically create an array if it does not exist', () => {
      // Arrange
      interface TestDto {
        foo: string[];
      }
      const newValue = 'baz';
      // Act
      const builder = createBuilder<TestDto>();
      builder.addFoo(newValue);
      // Assert
      expect(builder.getFoo()).toEqual([newValue]);
    });
  });

  describe('when counting the array values', () => {
    it('should return the correct count of array values', () => {
      // Arrange
      interface TestDto {
        foo: string[];
      }
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = createBuilder<TestDto>();
      builder.setFoo([value, newValue]);
      // Assert
      expect(builder.countFoo()).toBe(2);
    });

    it('should return 0 if the array does not exist', () => {
      // Arrange
      interface TestDto {
        foo: string[];
      }
      // Act
      const builder = createBuilder<TestDto>();
      // Assert
      expect(builder.countFoo()).toBe(0);
    });
  });

  describe('when validating the DTO object', () => {
    it('should return a validation error if the DTO object is not valid', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const error = new Error('Invalid DTO object');
      // Act
      const builder = createBuilder<TestDto, Error>(
        {},
        { validate: () => error },
      );
      const dto = builder.build();
      // Assert
      expect(dto).toEqual(left(expect.any(Error)));
    });
  });
});
