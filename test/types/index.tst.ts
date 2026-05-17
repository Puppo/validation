import { expect } from 'tstyche'
import fastify from 'fastify'
import { GraphQLDirective, GraphQLResolveInfo } from 'graphql'
import { MercuriusContext } from 'mercurius'
import mercuriusValidation, { MercuriusValidationHandler, MercuriusValidationHandlerMetadata, MercuriusValidationOptions } from '../..'

// Validate exported types
expect(mercuriusValidation.graphQLTypeDefs).type.toBe<string>()
expect(mercuriusValidation.graphQLDirective).type.toBe<GraphQLDirective>()

const app = fastify()

// Register without options
app.register(mercuriusValidation)
app.register(mercuriusValidation, {})

// Register with AJV options
app.register(mercuriusValidation, {
  coerceTypes: false
})

// Use different modes
app.register(mercuriusValidation, { mode: 'JTD' })
app.register(mercuriusValidation, { mode: 'JSONSchema' })

// Turn directive validation on/off
app.register(mercuriusValidation, { directiveValidation: true })
app.register(mercuriusValidation, { directiveValidation: false })

// Register JSON Schema definitions
app.register(mercuriusValidation, {
  mode: 'JSONSchema',
  schema: {
    Filters: {
      text: { minLength: 1 }
    },
    Query: {
      message: {
        id: {
          minLength: 1
        }
      }
    }
  }
})

// Register JTD definitions
app.register(mercuriusValidation, {
  mode: 'JTD',
  schema: {
    Filters: {
      text: { enum: ['hello', 'there'] }
    },
    Query: {
      message: {
        id: {
          type: 'uint8'
        }
      }
    }
  }
})

// Register Function definitions - types inferred from schema
app.register(mercuriusValidation, {
  schema: {
    Query: {
      message: {
        async id (metadata, value, parent, args, context, info) {
          // Verify handler receives correct inferred types
          expect(metadata).type.toBe<MercuriusValidationHandlerMetadata>()
          expect(value).type.toBe<any>()
          expect(parent).type.toBe<any>()
          expect(args).type.toBe<any>()
          expect(context).type.toBe<MercuriusContext>()
          expect(info).type.toBe<GraphQLResolveInfo>()
        }
      }
    }
  }
})

// Custom types for testing generics
interface CustomParent {
  parent: Record<string, any>;
}
interface CustomArgs {
  arg: Record<string, any>;
}
interface CustomContext extends MercuriusContext {
  hello?: string;
}

// Using options as object without generics - types inferred as any/base
const validationOptions: MercuriusValidationOptions = {
  schema: {
    Query: {
      message: {
        async id (metadata, value, parent, args, context, info) {
          // Without generics, types default to any/MercuriusContext
          expect(metadata).type.toBe<MercuriusValidationHandlerMetadata>()
          expect(value).type.toBe<any>()
          expect(parent).type.toBe<any>()
          expect(args).type.toBe<any>()
          expect(context).type.toBe<MercuriusContext>()
        }
      }
    }
  }
}
app.register(mercuriusValidation, validationOptions)

// Using options as input object with generics - explicit type parameters
const authOptionsWithGenerics: MercuriusValidationOptions<CustomParent, CustomArgs, CustomContext> = {
  schema: {
    Query: {
      message: {
        async id (metadata, value, parent, args, context, info) {
          // With generics, types are correctly inferred as custom types
          expect(metadata).type.toBe<MercuriusValidationHandlerMetadata>()
          expect(value).type.toBe<any>()
          expect(parent).type.toBe<CustomParent>()
          expect(args).type.toBe<CustomArgs>()
          expect(context).type.toBe<CustomContext>()
          expect(context?.hello).type.toBe<string | undefined>()
          expect(info).type.toBe<GraphQLResolveInfo>()
        }
      }
    }
  }
}
app.register(mercuriusValidation, authOptionsWithGenerics)

// Creating functions using handler types - infer from generic
const id: MercuriusValidationHandler<{}, {}, CustomContext> =
  async (metadata, value, parent, args, context, info) => {
    // Parent and args are {} as specified in generics
    expect(metadata).type.toBe<MercuriusValidationHandlerMetadata>()
    expect(value).type.toBe<any>()
    expect(parent).type.toBe<{}>()
    expect(args).type.toBe<{}>()
    expect(context).type.toBe<CustomContext>()
    expect(context?.hello).type.toBe<string | undefined>()
    expect(info).type.toBe<GraphQLResolveInfo>()
  }
app.register(mercuriusValidation, {
  schema: {
    Query: {
      message: {
        id
      }
    }
  }
})