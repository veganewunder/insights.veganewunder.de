export class MetaContentError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "MetaContentError";
    this.status = status;
  }
}

