export const successPayload = (description: string) => () => ({
  message: "Successful Operation",
  description,
  type: "success" as const,
});

export const errorPayload = (description: string) => () => ({
  message: "Operation Error",
  description,
  type: "error" as const,
});
