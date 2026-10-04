export type LogLevel =
  | "info"
  | "warn"
  | "error";

export function log(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: "streampay-backend",
      event,
      ...fields,
    }),
  );
}
