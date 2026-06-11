import { generateMiddleware, z } from "genkit";

export const loggerMiddleware = generateMiddleware(
  {
    name: "loggerMiddleware",
    description: "Logs requests and responses",
    configSchema: z.object({
      verbose: z.boolean().optional(),
    }),
  },
  ({ config, ai }) => {
    const verbose = config?.verbose || false;
    return {
      model: async (req, ctx, next) => {
        if (verbose) {
          console.log("Request:", JSON.stringify(req, null, 2));
        }
        const resp = await next(req, ctx);
        if (verbose) {
          console.log("Response:", JSON.stringify(resp, null, 2));
        }
        return resp;
      },
    };
  },
);
