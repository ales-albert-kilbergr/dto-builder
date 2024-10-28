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

  public get(): Partial<DTO>;
  public get(key: keyof DTO): DTO[keyof DTO] | undefined;
  public get(key?: keyof DTO): Partial<DTO> | DTO[keyof DTO] | undefined {
    if (key) {
      return this.dto[key];
    }

    return this.dto;
  }

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
   * @returns {this} The builder instance.
   */
  public reset(): this {
    this.dto = deepClone(this.initData);

    return this;
  }

  public useValidator(validatorFn?: DtoObjectValidator<DTO>): this {
    this.validator = validatorFn;

    return this;
  }

  public useTransformer(transformerFn?: DtoObjectTransformer<DTO>): this {
    this.transformer = transformerFn;

    return this;
  }

  public build(
    override: Partial<DTO> = {},
  ): Either<DtoValidationFailedException<DTO>, DTO> {
    const dtoData = Object.assign({}, this.dto, override);
    const dtoObj = this.transformer
      ? this.transformer(dtoData)
      : (dtoData as DTO);

    if (this.validator) {
      const validationError = this.validator(dtoData);

      if (validationError !== true) {
        return left(
          new DtoValidationFailedException<DTO>(dtoObj, validationError),
        );
      }
    }

    return right(dtoObj);
  }
}
