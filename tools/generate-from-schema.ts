import 'source-map-support/register';
import { transformSchema } from './json-schema';

async function main(args : string[]) {
    let [inputDir, outputDir] = args;
    await transformSchema({ 
        inputDir, 
        outputDir,
        nameTransformer: (name : string) => ({
            'queryapi-subscription-response': 'QueryApiSubscriptionResponse',
            'queryapi-subscriptions-post-request': 'QueryApiSubscriptionsPostRequest',
            'queryapi-subscriptions-response': 'QueryApiSubscriptionsResponse',
            'queryapi-subscriptions-websocket': 'QueryApiSubscriptionsWebsocket',
            'queryapi-base': 'QueryApiBase',
            'nodeapi-base': 'NodeApiBase',
            'nodeapi-receiver-target': 'NodeApiReceiverTarget',
            'flow_sdianc_data': 'FlowSdiAncData',
            'registrationapi-base': 'RegistrationApiBase',
            'registrationapi-health-response': 'RegistrationApiHealthResponse',
            'registrationapi-resource-post-request': 'RegistrationApiResourcePostRequest',
            'registrationapi-resource-response': 'RegistrationApiResourceResponse'
        }[name])
    });
}

main(process.argv.slice(2));