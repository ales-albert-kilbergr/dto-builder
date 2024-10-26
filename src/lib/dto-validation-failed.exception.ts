export class DtoValidationFailedException<
  DTO extends object | null = null,
> extends Error {
  public readonly dto: DTO;

  public readonly validationErrors: Error[];

  public constructor(dto: DTO, validationError: Error | Error[]) {
    const validationErrorMessage = Array.isArray(validationError)
      ? validationError
          .map((error) => `[${error.constructor.name}]: ${error.message}`)
          .join('\n\t')
      : validationError.message;

    super(
      'Cannot build a DTO. Validation failed!\n\t' + validationErrorMessage,
    );

    this.dto = dto;
    this.validationErrors = Array.isArray(validationError)
      ? validationError
      : [validationError];
  }
}
