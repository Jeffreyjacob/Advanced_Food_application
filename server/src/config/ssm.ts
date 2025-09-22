import {
  SSMClient,
  GetParametersByPathCommand,
  GetParametersByPathCommandOutput,
} from '@aws-sdk/client-ssm';

const ssm = new SSMClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function loadEnvFromSSM(
  path: string = '/advancedFoodApplication/PROD'
) {
  console.log(`Loading environment variables from SSM path: ${path}`);

  let nextToken: string | undefined = undefined;

  do {
    const command = new GetParametersByPathCommand({
      Path: path,
      Recursive: true,
      WithDecryption: true,
      NextToken: nextToken,
    });

    // 👇 explicitly type the response
    const response: GetParametersByPathCommandOutput = await ssm.send(command);

    if (response.Parameters) {
      for (const param of response.Parameters) {
        if (param.Name && param.Value) {
          const name = param.Name.split('/').pop()!;
          process.env[name] = param.Value;
          console.log(`Loaded ${name} from SSM`);
        }
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  console.log('✅ All SSM parameters loaded into process.env');
}
