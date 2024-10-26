/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DtoBuilder } from './dto-builder';

/**
 * A helper type to check if the provided type is an array.
 */
export type IsArray<T> = T extends any[] ? true : false;
/**
 * A helper type which generate the "add" method for each array property.
 */
export type AddMethod<T, K extends keyof T, R = void> =
  T[K] extends Array<infer U>
    ? { [Method in `add${Capitalize<string & K>}`]: (...item: U[]) => R }
    : object;
/**
 * A helper type which generate the "count" method for each array property.
 */
export type CountMethod<T, K extends keyof T> = T[K] extends any[]
  ? { [Method in `count${Capitalize<string & K>}`]: () => number }
  : object;
/**
 * A helper type which defines the validator function for the DTO object.
 */
export type DtoObjectValidator<DTO extends object | null> = (
  data: Partial<DTO>,
) => true | Error | Error[];
/**
 * A helper type which defines the transformer function for the DTO object.
 */
export type DtoObjectTransformer<DTO extends object | null> = (
  data: Partial<DTO>,
) => DTO;
/**
 * A helper type which infers the DTO from the builder.
 */
export type ExtractDto<BUILDER extends DtoBuilder> =
  BUILDER extends DtoBuilder<infer DTO> ? DTO : never;

export type DtoBuilderGetter<BUILDER extends DtoBuilder> = {
  [K in keyof ExtractDto<BUILDER> as `get${Capitalize<string & K>}`]-?: () => ExtractDto<BUILDER>[K];
};

export type DtoBuilderSetter<BUILDER extends DtoBuilder> = {
  [K in keyof ExtractDto<BUILDER> as `set${Capitalize<string & K>}`]-?: (
    value: ExtractDto<BUILDER>[K],
  ) => DtoBuilderProxy<BUILDER>;
};

export type DtoBuilderAddMethod<BUILDER extends DtoBuilder> = {
  [K in keyof ExtractDto<BUILDER> as AddMethod<
    ExtractDto<BUILDER>,
    K
  > extends object
    ? keyof AddMethod<ExtractDto<BUILDER>, K, BUILDER>
    : never]: AddMethod<ExtractDto<BUILDER>, K, BUILDER>[keyof AddMethod<
    ExtractDto<BUILDER>,
    K
  >];
};

export type DtoCountMethod<BUILDER extends DtoBuilder> = {
  [K in keyof ExtractDto<BUILDER> as CountMethod<
    ExtractDto<BUILDER>,
    K
  > extends object
    ? keyof CountMethod<ExtractDto<BUILDER>, K>
    : never]: CountMethod<ExtractDto<BUILDER>, K>[keyof CountMethod<
    ExtractDto<BUILDER>,
    K
  >];
};

export type DtoBuilderProxy<BUILDER extends DtoBuilder<any>> = BUILDER &
  DtoBuilderSetter<BUILDER> &
  DtoBuilderGetter<BUILDER> &
  DtoBuilderAddMethod<BUILDER> &
  DtoCountMethod<BUILDER>;
