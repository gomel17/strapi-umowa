/**
 * Validates required environment variables
 * @throws Error if any required environment variables are missing
 */
export function validateEnv(): void {
  const requiredEnvVars = [
    'NEXT_PUBLIC_STRAPI_API_URL',
    'STRAPI_API_TOKEN'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(
    envVar => !process.env[envVar]
  );
  
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
      'Please check your .env.local file or environment configuration.'
    );
  }
}