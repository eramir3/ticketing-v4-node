import type { ApolloServerPlugin } from '@apollo/server';

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

            if (Array.isArray(extErrors)) {
              return extErrors.map(({ field, message }) =>
                field ? { field, message } : { message },
              );
            }

            return [{ message: error.message }];
          });

          if (result.data === null) {
            delete result.data;
          }
        },
      };
    },
  };
}