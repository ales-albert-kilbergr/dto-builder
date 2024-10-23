import { Either, left, right } from 'fp-ts/Either';

/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IsArray<T> = T extends Array<any> ? true : false;

// Helper type to define methods for array properties
export type AddMethod<T, K extends keyof T> =
  T[K] extends Array<infer U>
    ? { [Method in `add${Capitalize<string & K>}`]: (...item: U[]) => void }
    : object;

export type CountMethod<T, K extends keyof T> =
  T[K] extends Array<any>
    ? { [Method in `count${Capitalize<string & K>}`]: () => number }
    : object;

export type DtoBuilderBase<DATA extends object | null, ERROR = never> = {
  clone: () => DtoBuilder<DATA>;
  extend: <EXT_DATA extends object>() => DtoBuilder<DATA & EXT_DATA>;
  build: (override?: Partial<DATA>) => Either<ERROR, DATA>;
  patch: (override?: Partial<DATA>) => DtoBuilder<DATA>;
};

export type DtoBuilderGetter<DATA extends object | null> = {
  [K in keyof DATA as `get${Capitalize<string & K>}`]-?: {
    (): DATA[K];
  };
};

export type DtoBuilderSetter<DATA extends object | null> = {
  [K in keyof DATA as `set${Capitalize<string & K>}`]-?: {
    (value: DATA[K]): DtoBuilder<DATA>;
  };
};

export type DtoAddMethod<DATA extends object | null> = {
  [K in keyof DATA as AddMethod<DATA, K> extends object
    ? keyof AddMethod<DATA, K>
    : never]: AddMethod<DATA, K>[keyof AddMethod<DATA, K>];
};

export type DtoCountMethod<DATA extends object | null> = {
  [K in keyof DATA as CountMethod<DATA, K> extends object
    ? keyof CountMethod<DATA, K>
    : never]: CountMethod<DATA, K>[keyof CountMethod<DATA, K>];
};

export type DtoBuilder<
  DATA extends object | null,
  ERROR = never,
> = DtoBuilderBase<DATA, ERROR> &
  DtoBuilderSetter<DATA> &
  DtoBuilderGetter<DATA> &
  DtoAddMethod<DATA> &
  DtoCountMethod<DATA>;

export interface DtoBuilderOptions<
  DATA extends object | null = null,
  ERROR = never,
> {
  validate?: (data: Partial<DATA>) => true | ERROR;
}

export function createBuilder<DATA extends object | null, ERROR = never>(
  initData: Partial<DATA> = {},
  options: DtoBuilderOptions<DATA, ERROR> = {},
): DtoBuilder<DATA, ERROR> {
  const data: Partial<DATA> = initData;

  const base = {};

  const builder = new Proxy(base, {
    get(_, prop: string | symbol) {
      if (typeof prop === 'symbol') {
        throw new TypeError(
          'Symbol properties are not supported on a DTO builder',
        );
      }

      if (prop === 'clone') {
        return () => createBuilder<DATA, ERROR>({ ...data }, { ...options });
      }

      if (prop === 'extend') {
        return <EXT_DATA extends object>() =>
          createBuilder<DATA & EXT_DATA, ERROR>(
            { ...data } as Partial<DATA & EXT_DATA>,
            { ...options },
          );
      }

      if (prop === 'patch') {
        return (override: Partial<DATA>) => {
          Object.assign(data, override);
          return builder;
        };
      }

      if (prop === 'build') {
        return (override: Partial<DATA> = {}) => {
          const newData = Object.assign({}, data, override);

          if (options.validate) {
            const validationError = options.validate(newData);

            if (validationError !== true) {
              return left(validationError);
            } else {
              return right(newData as DATA);
            }
          }

          return right(newData);
        };
      }

      // If prop is a set method
      if (/^set[A-Z]/.test(prop as string)) {
        const key: keyof DATA = prop.slice(3).toLowerCase() as keyof DATA;

        return (value: DATA[keyof DATA]) => {
          data[key] = value;
          return builder;
        };
      }

      if (/^get[A-Z]/.test(prop as string)) {
        const key: keyof DATA = prop.slice(3).toLowerCase() as keyof DATA;

        return () => data[key];
      }

      if (/add[A-Z]/.test(prop as string)) {
        const key: keyof DATA = prop.slice(3).toLowerCase() as keyof DATA;

        return (...value: DATA[keyof DATA][]) => {
          if (!Array.isArray(data[key])) {
            (data as any)[key] = [];
          }

          (data[key] as any).push(...value);
          return builder;
        };
      }

      if (/count[A-Z]/.test(prop as string)) {
        const key: keyof DATA = prop.slice(5).toLowerCase() as keyof DATA;

        return () => {
          if (!Array.isArray(data[key])) {
            return 0;
          }

          return (data[key] as any).length;
        };
      }

      throw new TypeError(`Property "${prop}" does not exist on Data builder`);
    },
  });

  return builder as DtoBuilder<DATA>;
}
