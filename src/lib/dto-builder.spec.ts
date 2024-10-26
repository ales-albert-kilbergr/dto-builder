import { DtoBuilder } from './dto-builder';
import { isRight, left, right } from 'fp-ts/Either';
import type { DtoBuilderProxy } from './dto-builder.types';

describe('(Unit) DtoBuilder', () => {
  describe('create', () => {
    it('should set a default empty data in constructor', () => {
      // Arrange
      // Act
      const builder = new DtoBuilder();
      // Assert
      expect(builder.get()).toEqual({});
    });

    it('should create a new instance', () => {
      // Arrange
      // Act
      const builder = DtoBuilder.create();
      // Assert
      expect(builder).toBeDefined();
    });

    it('should set the initial data', () => {
      // Arrange
      const data = { foo: 'bar' };
      // Act
      const builder = DtoBuilder.create(data);
      // Assert
      expect(builder.get()).toEqual(data);
    });

    it('should create a child builder', () => {
      // Arrange
      interface ChildDto {
        foo: string;
      }
      class ChildBuilder<DTO extends object> extends DtoBuilder<DTO> {}
      // Act
      const builder = ChildBuilder.create<ChildDto, ChildBuilder<ChildDto>>();
      // Assert
      expect(builder).toBeInstanceOf(ChildBuilder);
    });

    it('should expose child method on the builder', () => {
      // Arrange
      interface ChildDto {
        foo: string;
      }
      class ChildBuilder<DTO extends object> extends DtoBuilder<DTO> {
        public useSomething() {
          /* noop */
          return this;
        }
      }
      // Act
      const builder = ChildBuilder.create<ChildDto, ChildBuilder<ChildDto>>();
      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(builder.useSomething).toBeDefined();
    });

    it('should expose proxy methods on the child builder', () => {
      // Arrange
      interface ChildDto {
        foo: string;
      }
      class ChildBuilder<DTO extends object> extends DtoBuilder<DTO> {
        public useSomething() {
          /* noop */
          return this;
        }
      }
      // Act
      const builder = ChildBuilder.create<ChildDto, ChildBuilder<ChildDto>>();

      // Assert
      // Expect not to throw a compile error
      expect(typeof builder.setFoo === 'function').toBeTruthy();
    });

    it('should return a reference to a proxy builder from a child method', () => {
      // Arrange
      interface ChildDto {
        foo: string;
      }
      class ChildBuilder<DTO extends object> extends DtoBuilder<DTO> {
        public useSomething() {
          return this;
        }
      }
      // Act
      const builder = ChildBuilder.create<ChildDto, ChildBuilder<ChildDto>>();
      const returnedBuilder = builder.useSomething().setFoo('bar');
      // Assert
      expect(builder).toBe(returnedBuilder);
    });
  });

  describe('set', () => {
    it('should set a value on the DTO', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const builder = DtoBuilder.create<TestDto>();
      // Act
      const returnedBuilder = builder.set('foo', 'bar');
      // Assert
      expect(returnedBuilder.get()).toEqual({ foo: 'bar' });
    });

    it('should set all values on the DTO', () => {
      // Arrange
      interface TestDto {
        foo: string;
        bar: number;
      }
      const builder = DtoBuilder.create<TestDto>();
      // Act
      const returnedBuilder = builder.set({ foo: 'baz', bar: 42 });
      // Assert
      expect(returnedBuilder.get()).toEqual({ foo: 'baz', bar: 42 });
    });

    it('should return a reference to the proxy builder', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const builder = DtoBuilder.create<TestDto>();
      // Act
      const returnedBuilder = builder.set('foo', 'bar');
      // Assert
      expect(returnedBuilder).toBe(builder);
    });

    it('should allow to chain the multiple proxy builder methods on a dto builder', () => {
      // Arrange
      interface TestDto {
        foo: string;
        bar: number;
      }
      const builder = DtoBuilder.create<TestDto>();
      // Act
      const returnedBuilder = builder.set('foo', 'bar').setBar(42);
      // Assert
      expect(returnedBuilder.get()).toEqual({ foo: 'bar', bar: 42 });
    });

    it('should allow to chain the multiple proxy builder methods on a dto child builder with object', () => {
      // Arrange
      interface TestDto {
        foo: string;
        bar: number;
      }
      class TestBuilder extends DtoBuilder<TestDto> {}
      const builder = TestBuilder.create<TestDto, TestBuilder>();
      // Act
      const returnedBuilder = builder.set('foo', 'bar').setBar(42);
      // Assert
      expect(returnedBuilder.get()).toEqual({ foo: 'bar', bar: 42 });
    });
  });

  describe('get', () => {
    it('should get the value from the DTO', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const builder = DtoBuilder.create<TestDto>().set('foo', 'bar');
      // Act
      const value = builder.get('foo');
      // Assert
      expect(value).toBe('bar');
    });

    it('should get all values from the DTO', () => {
      // Arrange
      interface TestDto {
        foo: string;
        bar: number;
      }
      const builder = DtoBuilder.create<TestDto>().set({ foo: 'baz', bar: 42 });
      // Act
      const value = builder.get();
      // Assert
      expect(value).toEqual({ foo: 'baz', bar: 42 });
    });
  });

  // MARK: Patch
  describe('when patching the DTO object', () => {
    it('should allow to patch the DTO object', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = DtoBuilder.create<TestDto>();
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
      const builder = DtoBuilder.create<TestDto>();
      builder.setFoo(value).setBar(42);
      builder.patch({ foo: newValue });
      // Assert
      expect(builder.build()).toEqual(right({ foo: newValue, bar: 42 }));
    });

    it('should allow to chain the patch method', () => {
      // Arrange
      interface TestDto {
        foo: string;
        bar: number;
      }
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = DtoBuilder.create<TestDto>();
      builder.setFoo(value).setBar(42).patch({ foo: newValue });
      // Assert
      expect(builder.build()).toEqual(right({ foo: newValue, bar: 42 }));
    });

    it('should allow to chain the patch method on a child builder', () => {
      // Arrange
      interface TestDto {
        foo: string;
        bar: number;
      }
      class TestBuilder extends DtoBuilder<TestDto> {}
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = TestBuilder.create<TestDto, TestBuilder>();
      builder.setFoo(value).setBar(42).patch({ foo: newValue });
      // Assert
      expect(builder.build()).toEqual(right({ foo: newValue, bar: 42 }));
    });
  });

  // MARK: Setters and getters
  describe('dynamic setters and getters', () => {
    it('should expose setter and getter based on an interface', () => {
      // Arrange
      interface TestDto {
        foo: string;
        bar: number;
      }
      const value = 'bar';
      // Act
      const builder = DtoBuilder.create<TestDto>();
      builder.setFoo(value);
      // Assert
      expect(builder.getFoo()).toBe(value);
    });

    it('should allow to chain proxy setters', () => {
      // Arrange
      interface TestDto {
        foo: string;
        bar: number;
      }
      const value = 'bar';
      // Act
      const builder = DtoBuilder.create<TestDto>();
      builder.setFoo(value).setBar(42);
      // Assert
      expect(builder.get()).toEqual({ foo: value, bar: 42 });
    });

    it('should trigger a typescript error if the supplied value is not of the correct type', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const value = 42;
      // Act
      const builder = DtoBuilder.create<TestDto>();
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
      const builder = DtoBuilder.create<TestDto>();
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
      const builder = DtoBuilder.create<TestDto>();
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
      const builder = DtoBuilder.create<TestDto>();
      // @ts-expect-error - forcing an unexpected access
      const act = () => builder.foo;
      // Assert
      expect(act).toThrow(TypeError);
    });

    it('should override a setter with a special logic in the child', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      class TestBuilder extends DtoBuilder<TestDto> {
        public setFoo(value: string) {
          return super.set('foo', value.toUpperCase());
        }
      }
      const value = 'bar';
      // Act
      const builder = TestBuilder.create<TestDto, TestBuilder>();
      builder.setFoo(value);
      // Assert
      expect(builder.getFoo()).toBe(value.toUpperCase());
    });
  });

  // MARK: Add
  describe('when adding an array value', () => {
    it('should allow to add a value to an array', () => {
      // Arrange
      interface TestDto {
        foo: string[];
      }
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = DtoBuilder.create<TestDto>();
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
      const builder = DtoBuilder.create<TestDto>();
      builder.addFoo(newValue);
      // Assert
      expect(builder.getFoo()).toEqual([newValue]);
    });

    it('should allow to chain child builder methods', () => {
      // Arrange
      interface TestDto {
        foo: string[];
      }
      const value = 'bar';
      const newValue = 'baz';
      class TestBuilder extends DtoBuilder<TestDto> {
        public childMethod(): DtoBuilderProxy<TestBuilder> {
          return this as unknown as DtoBuilderProxy<TestBuilder>;
        }
      }
      // Act
      const builder = TestBuilder.create<TestDto, TestBuilder>();
      builder.addFoo(value).childMethod().addFoo(newValue);
      // Assert
      expect(builder.getFoo()).toEqual([value, newValue]);
    });
  });

  // MARK: Count
  describe('when counting the array values', () => {
    it('should return the correct count of array values', () => {
      // Arrange
      interface TestDto {
        foo: string[];
      }
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = DtoBuilder.create<TestDto>();
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
      const builder = DtoBuilder.create<TestDto>();
      // Assert
      expect(builder.countFoo()).toBe(0);
    });

    it('should count an array under prop with capital letter', () => {
      // Arrange
      interface TestDto {
        fooBar: string[];
      }
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = DtoBuilder.create<TestDto>();
      builder.setFooBar([value, newValue]);
      // Assert
      expect(builder.countFooBar()).toBe(2);
    });

    it('should allow to count on a child builder', () => {
      // Arrange
      interface TestDto {
        foo: string[];
      }
      class TestBuilder extends DtoBuilder<TestDto> {}
      const value = 'bar';
      const newValue = 'baz';
      // Act
      const builder = TestBuilder.create<TestDto, TestBuilder>();
      builder.setFoo([value, newValue]);
      // Assert
      expect(builder.countFoo()).toBe(2);
    });
  });

  // MARK: Clone
  describe('when cloning the builder', () => {
    it('should create a clone with already set values', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const value = 'bar';
      // Act
      const builder = DtoBuilder.create<TestDto>();
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
      const builder = DtoBuilder.create<TestDto>();
      builder.setFoo(value);
      const clone = builder.clone();
      clone.setFoo(newValue);
      // Assert
      expect(builder.getFoo()).toBe(value);
      expect(clone.getFoo()).toBe(newValue);
    });

    it('should return an instance of the same child builder', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      class TestBuilder extends DtoBuilder<TestDto> {}
      // Act
      const builder = TestBuilder.create<TestDto, TestBuilder>();
      const clone = builder.clone();
      // Assert
      expect(clone).toBeInstanceOf(TestBuilder);
    });
  });

  // MARK: Build
  describe('when building the DTO object', () => {
    it('should build the DTO object', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const value = 'bar';
      // Act
      const builder = DtoBuilder.create<TestDto>();
      builder.setFoo(value);
      const dto = builder.build();
      // Assert
      expect(dto).toEqual(right({ foo: value }));
    });

    it('should keep the camel cased properties', () => {
      // Arrange
      interface TestDto {
        fooBar: string;
      }
      const value = 'bar';
      // Act
      const builder = DtoBuilder.create<TestDto>();
      builder.setFooBar(value);
      const dto = builder.build();
      // Assert
      expect(dto).toEqual(right({ fooBar: value }));
    });

    it('should return a validation error if the DTO object is not valid', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      const error = new Error('Invalid DTO object');
      // Act
      const builder = DtoBuilder.create<TestDto>({}).useValidator(() => error);
      const dto = builder.build();
      // Assert
      expect(dto).toEqual(left(expect.any(Error)));
    });

    it('should join the validation errors if there are multiple', () => {
      // Arrange
      interface TestDto {
        foo: string;
        bar: number;
      }
      const errorOne = new Error('Invalid Foo');
      const errorTwo = new Error('Invalid Bar');
      // Act
      const builder = DtoBuilder.create<TestDto>({}).useValidator(() => [
        errorOne,
        errorTwo,
      ]);
      const dto = builder.build();
      // Assert
      expect(dto).toEqual(
        left(
          expect.objectContaining({
            message:
              'Cannot build a DTO. Validation failed!' +
              '\n\t[Error]: Invalid Foo' +
              '\n\t[Error]: Invalid Bar',
          }),
        ),
      );
    });

    it('should return a reference to the builder if the validator is successful', () => {
      // Arrange
      interface TestDto {
        foo: string;
      }
      // Act
      const builder = DtoBuilder.create<TestDto>({});
      const returnedBuilder = builder.useValidator(() => true);
      // Assert
      expect(builder).toBe(returnedBuilder);
    });
  });

  it('should transform the DTO object', () => {
    // Arrange
    class TestDto {
      public foo?: string;
    }
    const value = 'bar';
    function transform(dto: TestDto) {
      const obj = new TestDto();
      Object.assign(obj, dto);

      return obj;
    }
    // Act
    const builder = DtoBuilder.create<TestDto>({ foo: value }).useTransformer(
      transform,
    );
    const dto = builder.build();
    // Assert
    expect(isRight(dto)).toBeTruthy();
    if (isRight(dto)) {
      expect(dto.right).toBeInstanceOf(TestDto);
    }
  });
});
