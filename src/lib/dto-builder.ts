import { type Either, left, right } from 'fp-ts/Either';
import { DtoValidationFailedException } from './dto-validation-failed.exception';

/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IsArray<T> = T extends any[] ? true : false;

// Helper type to define methods for array properties
export type AddMethod<T, K extends keyof T> =
  T[K] extends Array<infer U>
    ? { [Method in `add${Capitalize<string & K>}`]: (...item: U[]) => void }
    : object;

export type CountMethod<T, K extends keyof T> =
  T[K] extends Array<any>
    ? { [Method in `count${Capitalize<string & K>}`]: () => number }
    : object;

export type DtoObjectValidator<DTO extends object | null> = (
  data: Partial<DTO>,
) => true | Error | Error[];

export type DtoObjectTransformer<DTO extends object | null> = (
  data: Partial<DTO>,
) => DTO;

export type DtoBuilderBase<DTO extends object | null> = {
  clone: () => DtoBuilder<DTO>;
  extend: <EXT_DTO extends object>(
    override?: Partial<EXT_DTO & DTO>,
  ) => DtoBuilder<DTO & EXT_DTO>;
  build: (
    override?: Partial<DTO>,
  ) => Either<DtoValidationFailedException<DTO>, DTO>;
  patch: (override: Partial<DTO>) => DtoBuilder<DTO>;
  useValidator: (validator: DtoObjectValidator<DTO>) => DtoBuilder<DTO>;
  useTransformer: (transformer: DtoObjectTransformer<DTO>) => DtoBuilder<DTO>;
};

export type DtoBuilderGetter<DTO extends object | null> = {
  [K in keyof DTO as `get${Capitalize<string & K>}`]-?: {
    (): DTO[K];
  };
};

export type DtoBuilderSetter<DTO extends object | null> = {
  [K in keyof DTO as `set${Capitalize<string & K>}`]-?: {
    (value: DTO[K]): DtoBuilder<DTO>;
  };
};

export type DtoAddMethod<DTO extends object | null> = {
  [K in keyof DTO as AddMethod<DTO, K> extends object
    ? keyof AddMethod<DTO, K>
    : never]: AddMethod<DTO, K>[keyof AddMethod<DTO, K>];
};

export type DtoCountMethod<DTO extends object | null> = {
  [K in keyof DTO as CountMethod<DTO, K> extends object
    ? keyof CountMethod<DTO, K>
    : never]: CountMethod<DTO, K>[keyof CountMethod<DTO, K>];
};

export type DtoBuilder<DTO extends object | null> = DtoBuilderBase<DTO> &
  DtoBuilderSetter<DTO> &
  DtoBuilderGetter<DTO> &
  DtoAddMethod<DTO> &
  DtoCountMethod<DTO>;

function extractKey<DTO>(prefix: string, prop: string): keyof DTO {
  return prop
    .replace(new RegExp(`^${prefix}`), '')
    .replace(/^[A-Z]/, (match) => match.toLowerCase()) as keyof DTO;
}

export function createBuilder<DTO extends object | null>(
  initData: Partial<DTO> = {},
): DtoBuilder<DTO> {
  const dto: Partial<DTO> = initData;

  let validator: DtoObjectValidator<DTO> | undefined;
  let transformer: DtoObjectTransformer<DTO> | undefined;

  function clone(): DtoBuilder<DTO> {
    return createBuilder<DTO>({ ...dto });
  }

  function extend<EXT_DTO extends object>(
    override: Partial<DTO & EXT_DTO> = {},
  ): DtoBuilder<DTO & EXT_DTO> {
    return createBuilder<DTO & EXT_DTO>({ ...dto, ...override });
  }

  function patch(override: Partial<DTO>): DtoBuilder<DTO> {
    Object.assign(dto, override);
    return builder;
  }

  function useValidator(validatorFn: DtoObjectValidator<DTO>): DtoBuilder<DTO> {
    validator = validatorFn;

    return builder;
  }

  function useTransformer(
    transformerFn: DtoObjectTransformer<DTO>,
  ): DtoBuilder<DTO> {
    transformer = transformerFn;

    return builder;
  }

  function build(
    override: Partial<DTO> = {},
  ): Either<DtoValidationFailedException<DTO>, DTO> {
    const dtoData = Object.assign({}, dto, override);
    const dtoObj: DTO = transformer ? transformer(dtoData) : (dtoData as DTO);

    if (validator) {
      const validationError = validator(dtoData);

      if (validationError !== true) {
        return left(
          new DtoValidationFailedException<DTO>(dtoObj, validationError),
        );
      }
    }

    return right(dtoObj);
  }

  function createAddMethod(propertyKey: keyof DTO) {
    return (...value: DTO[keyof DTO][]) => {
      if (!Array.isArray(dto[propertyKey])) {
        (dto as any)[propertyKey] = [];
      }

      (dto[propertyKey] as any).push(...value);

      return builder;
    };
  }

  function createCountMethod(propertyKey: keyof DTO) {
    return () => {
      if (!Array.isArray(dto[propertyKey])) {
        return 0;
      }

      return (dto[propertyKey] as any).length;
    };
  }

  function createSetter(propertyKey: keyof DTO) {
    return (value: DTO[keyof DTO]) => {
      dto[propertyKey] = value;
      return builder;
    };
  }

  function createGetter(propertyKey: keyof DTO) {
    return () => dto[propertyKey];
  }

  const base: DtoBuilderBase<DTO> = {
    clone,
    extend,
    patch,
    useValidator,
    useTransformer,
    build,
  };

  const builder: DtoBuilder<DTO> = new Proxy(base, {
    get(_, prop: string | symbol) {
      // 1: --------------------------------------------------------------------
      // Call methods in base if they exists
      const baseObj: any = base;
      if (prop in baseObj && typeof baseObj[prop] === 'function') {
        return (...args: any[]) => {
          return Reflect.apply(baseObj[prop], baseObj, args);
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
        return createSetter(extractKey('set', prop));
      }

      // 4: --------------------------------------------------------------------
      // Generate getters based on the given interface
      if (/^get[A-Z]/.test(prop)) {
        return createGetter(extractKey('get', prop));
      }

      // 5: --------------------------------------------------------------------
      // Generate add methods for array properties
      if (/add[A-Z]/.test(prop)) {
        return createAddMethod(extractKey('add', prop));
      }

      // 6: --------------------------------------------------------------------
      // Generate count methods for array properties
      if (/count[A-Z]/.test(prop)) {
        return createCountMethod(extractKey('count', prop));
      }

      throw new TypeError(`Property "${prop}" does not exist on Data builder`);
    },
  }) as DtoBuilder<DTO>;

  return builder as DtoBuilder<DTO>;
}
