import type { ApolloServerPlugin } from '@apollo/server';
import { GraphQLError } from 'graphql';

export function createGraphQLErrorResponsePlugin(): ApolloServerPlugin {
  return {
    async requestDidStart() {
      return {
        async willSendResponse({ response }) {
          if (response.body.kind !== 'single') return;

          const result = response.body.singleResult;
          if (!result.errors?.length) return;

          result.errors = result.errors.flatMap((error) => {
            const extErrors = error.extensions?.errors;

            // Handle validation errors like:
            // extensions.errors = [{ field, message }]
            if (Array.isArray(extErrors)) {
              return extErrors.map(({ field, message }) =>
                new GraphQLError(message, {
                  extensions: field ? { field } : undefined,
                }),
              );
            }

            // Default error normalization
            return [
              new GraphQLError(error.message, {
                extensions: error.extensions?.field
                  ? { field: error.extensions.field }
                  : undefined,
              }),
            ];
          });

          if (result.data === null) {
            delete result.data;
          }
        },
      };
    },
  };
}