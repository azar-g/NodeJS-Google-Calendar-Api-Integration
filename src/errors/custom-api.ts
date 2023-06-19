export class CustomAPIError extends Error {
  constructor(public message: any) {
    super(message);
  }
}
