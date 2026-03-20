import {
  AckPolicy,
  DeliverPolicy,
  ReplayPolicy,
  nanos,
  type JetStreamClient,
  type JsMsg,
} from 'nats';
import { Listener } from './base-listener';
import { Subjects } from './subjects';

type TestEvent = {
  subject: Subjects.ExpirationComplete;
  data: {
    orderId: string;
  };
};

class TestListener extends Listener<TestEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
  queueGroupName = 'orders-service';

  onMessage(_data: TestEvent['data'], _msg: JsMsg) {
    return;
  }
}

describe('Listener', () => {
  it('includes maxDeliver in the consumer options', () => {
    const listener = new TestListener({} as JetStreamClient);

    expect(listener.consumerOptions()).toEqual({
      ack_policy: AckPolicy.Explicit,
      ack_wait: nanos(5 * 1000),
      deliver_policy: DeliverPolicy.All,
      durable_name: 'orders-service-expiration-complete',
      filter_subject: Subjects.ExpirationComplete,
      max_deliver: 5,
      replay_policy: ReplayPolicy.Instant,
    });
  });
});
