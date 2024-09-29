export class BaseError extends Error {}

export class NotImplementedError extends BaseError {}
export class ArgumentError extends BaseError {}
export class TypeMeAsCustomError extends BaseError {}

export class DbError extends BaseError {}
export class DbAlreadyExists extends DbError {}