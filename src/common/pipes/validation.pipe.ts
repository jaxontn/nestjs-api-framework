import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationError,
} from '@nestjs/common';
import { validate, ValidationError as ClassValidatorValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ConfigService } from '@nestjs/config';

/**
 * Validation Pipe
 *
 * Comprehensive validation pipe that validates incoming request data
 * using class-validator decorators and transforms data using class-transformer.
 *
 * Features:
 * - Class-validator validation
 * - Class-transformer data transformation
 * - Detailed error messages
 * - Custom error formatting
 * - Nested object validation
 * - Array validation
 * - Custom validation rules
 * - Performance optimization
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  private readonly whitelist: boolean;
  private readonly forbidNonWhitelisted: boolean;
  private readonly transform: boolean;
  private readonly transformOptions: any;
  private readonly skipMissingProperties: boolean;
  private readonly skipNullProperties: boolean;
  private readonly skipUndefinedProperties: boolean;

  constructor(private readonly configService: ConfigService) {
    this.whitelist = this.configService.get<boolean>('validation.whitelist', true);
    this.forbidNonWhitelisted = this.configService.get<boolean>(
      'validation.forbidNonWhitelisted',
      true
    );
    this.transform = this.configService.get<boolean>('validation.transform', true);
    this.transformOptions = this.configService.get<any>(
      'validation.transformOptions',
      {}
    );
    this.skipMissingProperties = this.configService.get<boolean>(
      'validation.skipMissingProperties',
      false
    );
    this.skipNullProperties = this.configService.get<boolean>(
      'validation.skipNullProperties',
      false
    );
    this.skipUndefinedProperties = this.configService.get<boolean>(
      'validation.skipUndefinedProperties',
      false
    );
  }

  /**
   * Validates and transforms incoming data
   *
   * @param value The value to validate
   * @param metadata Argument metadata
   * @returns Validated and transformed value
   * @throws BadRequestException if validation fails
   */
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    // Skip validation if no validation target is provided
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    // Transform plain object to class instance
    const object = plainToClass(metadata.metatype, value, this.transformOptions);

    // Perform validation
    const errors = await validate(object, {
      whitelist: this.whitelist,
      forbidNonWhitelisted: this.forbidNonWhitelisted,
      skipMissingProperties: this.skipMissingProperties,
      skipNullProperties: this.skipNullProperties,
      skipUndefinedProperties: this.skipUndefinedProperties,
      validationError: {
        target: false,
        value: this.configService.get<boolean>('validation.includeValueInError', false),
      },
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatValidationErrors(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    // Return transformed object if transform is enabled
    return this.transform ? object : value;
  }

  /**
   * Determines if the metatype should be validated
   *
   * @param metatype The metatype to check
   * @returns True if validation should be performed
   */
  private toValidate(metatype: any): boolean {
    // Skip built-in types
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Formats validation errors into a user-friendly format
   *
   * @param errors Array of validation errors
   * @returns Formatted error array
   */
  private formatValidationErrors(errors: ClassValidatorValidationError[]): ValidationError[] {
    return errors.map((error) => this.formatValidationError(error));
  }

  /**
   * Formats a single validation error
   *
   * @param error The validation error to format
   * @returns Formatted validation error
   */
  private formatValidationError(error: ClassValidatorValidationError): ValidationError {
    const constraints = error.constraints;
    const children = error.children;

    const formattedError: ValidationError = {
      field: error.property,
      message: this.getErrorMessage(error),
      value: error.value,
    };

    // Add validation constraints if available
    if (constraints && Object.keys(constraints).length > 0) {
      formattedError.constraints = Object.values(constraints);
    }

    // Add nested validation errors if available
    if (children && children.length > 0) {
      formattedError.children = children.map((child) =>
        this.formatValidationError(child)
      );
    }

    return formattedError;
  }

  /**
   * Gets appropriate error message for validation error
   *
   * @param error The validation error
   * @returns Error message string
   */
  private getErrorMessage(error: ClassValidatorValidationError): string {
    const constraints = error.constraints;

    if (!constraints) {
      return 'Validation failed';
    }

    // Prefer custom messages
    const messagePriority = [
      'custom',
      'isDefined',
      'isNotEmpty',
      'isNotEmptyObject',
      'isIn',
      'isNotIn',
      'isEmail',
      'isUrl',
      'isDateString',
      'isNumber',
      'isInt',
      'isString',
      'isBoolean',
      'isArray',
      'isObject',
      'minLength',
      'maxLength',
      'min',
      'max',
      'matches',
      'isAlpha',
      'isAlphanumeric',
      'isAscii',
      'isBase64',
      'isDate',
      'isDecimal',
      'isDivisibleBy',
      'isEnum',
      'isJSON',
      'isJWT',
      'isLatLong',
      'isLatitude',
      'isLongitude',
      'isLowercase',
      'isMobilPhone',
      'isNegative',
      'isNotEmptyString',
      'isPositive',
      'isStringContains',
      'isStringNotContains',
      'isStringStrongPassword',
      'isUppercase',
    ];

    for (const constraint of messagePriority) {
      if (constraints[constraint]) {
        return constraints[constraint];
      }
    }

    // Return first available message
    return Object.values(constraints)[0];
  }

  /**
   * Validates nested objects recursively
   *
   * @param object Object to validate
   * @param metatype Metatype for validation
   * @param path Object path for error reporting
   * @returns Array of validation errors
   */
  private async validateNested(
    object: any,
    metatype: any,
    path: string = ''
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    if (!object || typeof object !== 'object') {
      return errors;
    }

    // Validate each property
    for (const [key, value] of Object.entries(object)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Skip undefined properties if configured
      if (value === undefined && this.skipUndefinedProperties) {
        continue;
      }

      // Skip null properties if configured
      if (value === null && this.skipNullProperties) {
        continue;
      }

      // If value is an object, validate recursively
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nestedType = Reflect.getMetadata('design:type', object, key);
        if (nestedType && this.toValidate(nestedType)) {
          const nestedErrors = await this.validateNested(value, nestedType, currentPath);
          errors.push(...nestedErrors);
        }
      }

      // If value is an array, validate each item
      if (Array.isArray(value)) {
        const arrayType = Reflect.getMetadata('design:arraytype', object, key);
        if (arrayType && this.toValidate(arrayType)) {
          for (let i = 0; i < value.length; i++) {
            const arrayItemErrors = await this.validateNested(
              value[i],
              arrayType,
              `${currentPath}[${i}]`
            );
            errors.push(...arrayItemErrors);
          }
        }
      }
    }

    return errors;
  }

  /**
   * Custom validation rules
   *
   * @param value Value to validate
   * @param metatype Metatype for validation
   * @returns Promise resolving to validation errors
   */
  private async customValidation(
    value: any,
    metatype: any
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Custom validation rules can be added here
    // Example: password strength validation
    if (metatype.name === 'CreateUserDto' && value.password) {
      const passwordErrors = this.validatePasswordStrength(value.password);
      if (passwordErrors.length > 0) {
        errors.push({
          field: 'password',
          message: 'Password does not meet security requirements',
          constraints: passwordErrors,
        });
      }
    }

    // Example: email uniqueness validation (would require database lookup)
    if (value.email) {
      // const isUnique = await this.checkEmailUniqueness(value.email);
      // if (!isUnique) {
      //   errors.push({
      //     field: 'email',
      //     message: 'Email already exists',
      //   });
      // }
    }

    return errors;
  }

  /**
   * Validates password strength
   *
   * @param password Password to validate
   * @returns Array of password validation errors
   */
  private validatePasswordStrength(password: string): string[] {
    const errors: string[] = [];
    const minLength = this.configService.get<number>('validation.password.minLength', 8);
    const requireUppercase = this.configService.get<boolean>(
      'validation.password.requireUppercase',
      true
    );
    const requireLowercase = this.configService.get<boolean>(
      'validation.password.requireLowercase',
      true
    );
    const requireNumbers = this.configService.get<boolean>(
      'validation.password.requireNumbers',
      true
    );
    const requireSpecialChars = this.configService.get<boolean>(
      'validation.password.requireSpecialChars',
      false
    );

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return errors;
  }

  /**
   * Validates email format and domain
   *
   * @param email Email to validate
   * @returns True if email is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional domain validation
    const [localPart, domain] = email.split('@');
    if (domain.length < 4 || domain.length > 253) {
      return false;
    }

    if (localPart.length > 64) {
      return false;
    }

    return true;
  }

  /**
   * Validates phone number format
   *
   * @param phone Phone number to validate
   * @returns True if phone number is valid
   */
  private isValidPhone(phone: string): boolean {
    // Support various phone number formats
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    return phoneRegex.test(phone) && cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  /**
   * Validates URL format
   *
   * @param url URL to validate
   * @returns True if URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates date string format
   *
   * @param dateString Date string to validate
   * @returns True if date is valid
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Validates UUID format
   *
   * @param uuid UUID string to validate
   * @returns True if UUID is valid
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

/**
 * Validation Error Interface
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  constraints?: string[];
  children?: ValidationError[];
}