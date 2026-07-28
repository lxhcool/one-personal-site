import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

type ApiDataResponseOptions = {
  isArray?: boolean;
  status?: 200 | 201;
  extraModels?: Type<unknown>[];
};

export function ApiDataResponse<TModel extends Type<unknown>>(
  model: TModel,
  options: ApiDataResponseOptions = {},
) {
  const modelSchema = { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(model, ...(options.extraModels ?? [])),
    ApiResponse({
      status: options.status ?? 200,
      schema: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', enum: [true] },
          data: options.isArray
            ? { type: 'array', items: modelSchema }
            : modelSchema,
        },
      },
    }),
  );
}
