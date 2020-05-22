import { Poller } from './Poller';
import PubSub from './PubSub';

test('Poller should work', () => {
    const pubsub = new PubSub();
    let pollCount = 0;
    let progressCount = 0;
    const onPoll = () => {
        pollCount += 1;
    };
    const onProgress = () => {
        progressCount += 1;
    };
    const poller = new Poller({
        pubsub,
        progressSteps: 10,
        pollInterval: 100,
        watchInterval: 10,
        onPoll,
        onProgress
    });

    poller.start();
});