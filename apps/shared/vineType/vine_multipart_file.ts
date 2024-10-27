import vine, { BaseLiteralType, Vine } from '@vinejs/vine'
import { FieldContext, FieldOptions, Validation } from '@vinejs/vine/types'
import { MultipartFile } from '@adonisjs/core/bodyparser'

const isMultipartFileArray = vine.createRule((value: unknown, _, field: FieldContext) => {
  /**
   * Ensure value is an array of MultipartFile
   */
  if (
    !(
      value &&
      typeof value === 'object' &&
      'clientName' in value &&
      'size' in value &&
      'isMultipartFile' in value &&
      value.isMultipartFile
    )
  ) {
    field.report('The {{ field }} must be an array of MultipartFile', 'attachments', field)
    return
  }

  /**
   * Create Multipart type
   */
  const files = value as MultipartFile[]

  /**
   * Mutate the field's value
   */
  field.mutate(files, field)
})

/**
 * Creating vineMultipartFile class
 */
export class VineMultipartFile extends BaseLiteralType<
  MultipartFile,
  MultipartFile,
  MultipartFile
> {
  constructor(options?: FieldOptions, validations?: Validation<unknown>[]) {
    super(options, validations || [isMultipartFileArray()])
  }

  clone() {
    return new VineMultipartFile(this.cloneOptions(), this.cloneValidations()) as this
  }
}

/**
 * Extend vine with MultipartFile type
 */
Vine.macro('multipartFile', function () {
  return new VineMultipartFile()
})

/**
 * Informing TypeScript about the newly added method
 */
declare module '@vinejs/vine' {
  interface Vine {
    multipartFile(): VineMultipartFile
  }
}
