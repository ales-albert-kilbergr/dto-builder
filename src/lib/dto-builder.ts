/* eslint-disable @typescript-eslint/no-explicit-any */
import { deepClone } from './deep-clone';
import type {
  DtoBuilderProxy,
  DtoObjectTransformer,
  DtoObjectValidator,
} from './dto-builder.types';
import { type Either, left, right } from 'fp-ts/Either';
import { DtoValidationFailedException } from './dto-validation-failed.exception';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function extractKey<DTO extends object = object>(
  prefix: string,
  prop: string,
): keyof DTO {
  return prop
    .replace(new RegExp(`^${prefix}`), '')
    .replace(/^[A-Z]/, (match) => match.toLowerCase()) as keyof DTO;
}
/**
 * The utility class to build a data transfer object. (Data only object).
 * The DTO builder takes an interface of a DTO and generates getters and setters
 * for its properties.
 */
export class DtoBuilder<DTO extends object = object> {
  protected dto: Partial<DTO>;

  protected initData: Partial<DTO>;

  protected validator: DtoObjectValidator<DTO> | undefined;

  protected transformer: DtoObjectTransformer<DTO> | undefined;

  public constructor(initData: Partial<DTO> = {}) {
    this.initData = initData;
    this.dto = deepClone(initData);
  }

  public static create<
    DTO extends object,
    T extends DtoBuilder<DTO> = DtoBuilder<DTO>,
  >(
    this: new (initData?: Partial<DTO>) => T,
    initData: Partial<DTO> = {},
  ): DtoBuilderProxy<T> {
    const target = new this(initData);

    const proxy: DtoBuilderProxy<T> = new Proxy(target, {
      get(_, prop: string | symbol) {
        // 1: --------------------------------------------------------------------
        // Call methods in base if they exists
        const baseObj: any = target;
        if (prop in baseObj && typeof baseObj[prop] === 'function') {
          return (...args: any[]) => {
            const result = Reflect.apply(baseObj[prop], baseObj, args);
            // If the method returns the base object ref, we expect that it
            // is a chaining method and we should return the wrapper builder
            // instead.
            return result === baseObj ? proxy : result;
          };
        }
        // 2: --------------------------------------------------------------------
        // Exclude all symbol access.
        if (typeof prop === 'symbol') {
          throw new TypeError(
            'Symbol properties are not supported on a DTO builder',
          );
        }
        // 3: --------------------------------------------------------------------
        // Generate setters based on the given interface
        if (/^set[A-Z]/.test(prop)) {
          const key = extractKey<DTO>('set', prop);
          return (value: DTO[keyof DTO]): DtoBuilderProxy<T> => {
            target.set(key, value);
            return proxy;
          };
        }
        // 4: --------------------------------------------------------------------
        // Generate getters based on the given interface
        if (/^get[A-Z]/.test(prop)) {
          const key = extractKey<DTO>('get', prop);
          return () => target.get(key);
        }
        // 5: --------------------------------------------------------------------
        // Generate add methods for array properties
        if (/add[A-Z]/.test(prop)) {
          const key = extractKey<DTO>('add', prop);
          return (...value: DTO[keyof DTO][]) => {
            const arr: any[] = (target.get(key) ?? []) as any[];

            arr.push(...value);

            target.set(key, arr as DTO[keyof DTO]);

            return proxy;
          };
        }

        // 6: --------------------------------------------------------------------
        // Generate count methods for array properties
        if (/count[A-Z]/.test(prop)) {
          const key = extractKey('count', prop);
          return () => {
            const arr: any[] | undefined = target.get(key) as any[] | undefined;

            if (!arr) {
              return 0;
            }

            return arr.length;
          };
        }

        throw new TypeError(
          `Property "${prop}" does not exist on Data builder`,
        );
      },
    }) as DtoBuilderProxy<T>;

    return proxy;
  }
  /**
   * Set whole DTO or a specific property of the DTO. If the key is not
   * provided, the method will set the whole DTO object. Otherwise, it will
   * set the specific property of the DTO.
   *
   * The method is chainable.
   *
   * @param value
   */
  public set(value: DTO): this;
  public set(key: keyof DTO, value: DTO[keyof DTO]): this;
  public set(keyOrValue: keyof DTO | DTO, value?: DTO[keyof DTO]): this {
    if (typeof keyOrValue === 'object') {
      this.dto = keyOrValue;
    } else {
      this.dto[keyOrValue] = value;
    }

    return this;
  }

  public patch(override: Partial<DTO>): this {
    Object.assign(this.dto, override);

    return this;
  }
  /**
   * Retrieve the DTO object or a specific property from the DTO.
   * If no key is provided, the method will return the entire DTO
   * in its current state.
   */
  public get(): Partial<DTO>;
  public get(key: keyof DTO): DTO[keyof DTO] | undefined;
  public get(key?: keyof DTO): Partial<DTO> | DTO[keyof DTO] | undefined {
    if (key) {
      return this.dto[key];
    }

    return this.dto;
  }
  /**
   * Create a clone of the current builder instance. The clone will take the
   * current DTO state as its initial state. As a consequence, if the clone
   * calls the `reset` method, it will revert to the current DTO state in
   * which the clone was created. The clone method will always create an
   * instance of the current builder class.
   *
   * Method is chainable.
   *
   * @returns {this} The cloned builder instance.
   */
  public clone(): this {
    const self = this.constructor as any;
    const clone = self.create(deepClone(this.dto));

    clone.useTransformer(this.transformer);
    clone.useValidator(this.validator);

    return clone as unknown as this;
  }
  /**
   * Reset the builder back to the initial state.
   *
   * Method is chainable.
   *
   * @returns {this} The builder instance.
   */
  public reset(): this {
    this.dto = deepClone(this.initData);

    return this;
  }
  /**
   * Use a validator function to validate the DTO object before building it.
   * The validator function should return `true` if the DTO object is valid.
   * Otherwise, it should return an error or an array of errors.
   *
   * This is useful when we want to integrate something like class-validator
   * or ajv schema validation of our DTO object.
   *
   * Method is chainable.
   *
   * @param validatorFn
   * @returns
   */
  public useValidator(validatorFn?: DtoObjectValidator<DTO>): this {
    this.validator = validatorFn;

    return this;
  }

  public getValidator(): DtoObjectValidator<DTO> | undefined {
    return this.validator;
  }
  /**
   * Use a transformation when a DTO object is built. This is useful when we
   * want to integrate something like class-transformer to convert a plain
   * object to a class instance.
   *
   * Method is chainable.
   *
   * @param transformerFn The transformer function.
   * @returns {this} The builder instance.
   */
  public useTransformer(transformerFn?: DtoObjectTransformer<DTO>): this {
    this.transformer = transformerFn;

    return this;
  }

  public getTransformer(): DtoObjectTransformer<DTO> | undefined {
    return this.transformer;
  }

  public async build(
    override: Partial<DTO> = {},
  ): Promise<Either<DtoValidationFailedException<DTO>, DTO>> {
    const dtoData = Object.assign({}, this.dto, override);
    const dtoObj = this.transformer
      ? this.transformer(dtoData)
      : (dtoData as DTO);

    if (this.validator) {
      const validationError = await this.validator(dtoObj);

      if (validationError !== true) {
        return left(
          new DtoValidationFailedException<DTO>(dtoObj, validationError),
        );
      }
    }

    return right(dtoObj);
  }
}
