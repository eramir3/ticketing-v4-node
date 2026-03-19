const axios = require('axios');

const DEFAULT_GRAPHQL_URL = 'https://ticketing.dev/api/gateway/graphql';
const DEFAULT_LIMIT = 200;
const CREATE_TICKET_MUTATION = `
  mutation CreateTicket($createTicketInput: CreateTicketInput!) {
    createTicket(createTicketInput: $createTicketInput) {
      id
    }
  }
`;
const UPDATE_TICKET_MUTATION = `
  mutation UpdateTicket($updateTicketInput: UpdateTicketInput!) {
    updateTicket(updateTicketInput: $updateTicketInput) {
      id
    }
  }
`;

function readPositiveInteger(value, fallback) {
  const parsedValue = Number.parseInt(value ?? '', 10);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  if (parsedValue <= 0) {
    throw new Error('STRESS_LIMIT must be greater than 0');
  }

  return parsedValue;
}

function getConfig() {
  const cookie = process.env.STRESS_COOKIE;

  if (!cookie) {
    throw new Error('STRESS_COOKIE is required');
  }

  return {
    graphqlUrl:
      process.env.STRESS_GRAPHQL_URL ??
      process.env.STRESS_BASE_URL ??
      DEFAULT_GRAPHQL_URL,
    cookie,
    limit: readPositiveInteger(process.env.STRESS_LIMIT, DEFAULT_LIMIT),
    insecureTls: process.env.STRESS_INSECURE_TLS === '1',
  };
}

async function graphqlRequest(client, query, variables) {
  const { data } = await client.post('', {
    query,
    variables,
  });

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const messages = data.errors
      .map((error) => error.message)
      .join('; ');

    throw new Error(`GraphQL request failed: ${messages}`);
  }

  return data.data;
}

async function doRequest(client, iteration) {
  const baseTitle = `ticket-${iteration + 1}`;
  const createResponse = await graphqlRequest(client, CREATE_TICKET_MUTATION, {
    createTicketInput: {
      title: baseTitle,
      price: 5,
    },
  });
  const ticketId = createResponse.createTicket.id;

  await graphqlRequest(client, UPDATE_TICKET_MUTATION, {
    updateTicketInput: {
      id: ticketId,
      title: `${baseTitle}-first-update`,
      price: 10,
    },
  });

  await graphqlRequest(client, UPDATE_TICKET_MUTATION, {
    updateTicketInput: {
      id: ticketId,
      title: `${baseTitle}-second-update`,
      price: 15,
    },
  });
}

async function main() {
  const config = getConfig();

  if (config.insecureTls) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const client = axios.create({
    baseURL: config.graphqlUrl,
    headers: {
      cookie: config.cookie,
      'content-type': 'application/json',
    },
  });

  console.log(
    `Running ${config.limit} sequential GraphQL ticket create/update cycles against ${config.graphqlUrl}`
  );

  for (let index = 0; index < config.limit; index += 1) {
    try {
      await doRequest(client, index);
    } catch (error) {
      throw new Error(`Iteration ${index + 1} failed`, { cause: error });
    }

    if ((index + 1) % 25 === 0 || index === config.limit - 1) {
      console.log(`Completed ${index + 1}/${config.limit}`);
    }
  }
}

main()
  .then(() => {
    console.log('Stress run complete');
  })
  .catch((error) => {
    if (axios.isAxiosError(error)) {
      console.error('Stress run failed');
      console.error('Status:', error.response?.status ?? 'unknown');
      console.error('Response:', error.response?.data ?? error.message);
      process.exit(1);
    }

    console.error(error);
    process.exit(1);
  });
