import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources'; // <-- Thay đổi ở đây
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';

const enableTracing = process.env.ENABLE_OTEL_TRACING !== 'false';

console.log(`OpenTelemetry tracing is ${enableTracing ? 'enabled' : 'disabled'} Value: ${process.env.ENABLE_OTEL_TRACING}.`);

export let sdk: NodeSDK | undefined;

if (enableTracing) {
    sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: 'vehicle-document-aggregator',
        }),
        spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
        instrumentations: [
            getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': { enabled: false }, 
            }),
        ],
    });

    sdk.start();

    process.on('SIGTERM', () => {
        sdk!
        .shutdown()
        .then(() => console.log('Tracing terminated successfully'))
        .catch((error) => console.error('Error terminating tracing', error))
        .finally(() => process.exit(0));
    });
}

export function initializeTracer(): void {
    if (!enableTracing) {
        return;
    }

    if (!sdk) {
        sdk = new NodeSDK({
        spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
        });
        sdk.start();
    }
}

export default sdk;
