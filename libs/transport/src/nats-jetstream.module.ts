import {
  DynamicModule,
  Global,
  Module,
  type FactoryProvider,
  type Provider,
} from '@nestjs/common';
import {
  connect,
  type ConnectionOptions,
  type JetStreamClient,
  type JetStreamOptions,
  type NatsConnection,
} from 'nats';
import {
  NATS_JETSTREAM_CLIENT,
  NATS_JETSTREAM_CONNECTION,
  NATS_JETSTREAM_MODULE_OPTIONS,
} from './nats-jetstream.constants';

export interface NatsJetStreamModuleOptions {
  servers: string | string[];
  connection?: Omit<ConnectionOptions, 'servers'>;
  jetstream?: JetStreamOptions;
}

export interface NatsJetStreamModuleAsyncOptions {
  imports?: any[];
  inject?: FactoryProvider['inject'];
  useFactory: (
    ...args: any[]
  ) => NatsJetStreamModuleOptions | Promise<NatsJetStreamModuleOptions>;
}

export function normalizeNatsServers(servers: string | string[]) {
  const normalizedServers = (Array.isArray(servers) ? servers : servers.split(','))
    .map((server) => server.trim())
    .filter(Boolean);

  if (normalizedServers.length === 0) {
    throw new Error('At least one NATS server must be configured');
  }

  return normalizedServers;
}

export function createNatsJetStreamConnectionOptions(
  options: NatsJetStreamModuleOptions
): ConnectionOptions {
  return {
    ...options.connection,
    servers: normalizeNatsServers(options.servers),
  };
}

@Global()
@Module({})
export class NatsJetStreamModule {
  static register(options: NatsJetStreamModuleOptions): DynamicModule {
    return this.createDynamicModule([], {
      provide: NATS_JETSTREAM_MODULE_OPTIONS,
      useValue: options,
    });
  }

  static registerAsync(options: NatsJetStreamModuleAsyncOptions): DynamicModule {
    return this.createDynamicModule(options.imports ?? [], {
      provide: NATS_JETSTREAM_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    });
  }

  private static createDynamicModule(
    imports: any[],
    optionsProvider: Provider
  ): DynamicModule {
    const connectionProvider = {
      provide: NATS_JETSTREAM_CONNECTION,
      inject: [NATS_JETSTREAM_MODULE_OPTIONS],
      useFactory: async (
        options: NatsJetStreamModuleOptions
      ): Promise<NatsConnection> =>
        connect(createNatsJetStreamConnectionOptions(options)),
    };

    const clientProvider = {
      provide: NATS_JETSTREAM_CLIENT,
      inject: [NATS_JETSTREAM_CONNECTION, NATS_JETSTREAM_MODULE_OPTIONS],
      useFactory: (
        connection: NatsConnection,
        options: NatsJetStreamModuleOptions
      ): JetStreamClient => connection.jetstream(options.jetstream),
    };

    return {
      module: NatsJetStreamModule,
      imports,
      providers: [optionsProvider, connectionProvider, clientProvider],
      exports: [NATS_JETSTREAM_CONNECTION, NATS_JETSTREAM_CLIENT],
    };
  }
}
