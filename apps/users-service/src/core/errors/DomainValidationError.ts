import { Entity } from "../entity/Entity";

export type DomainValidationErrors = {
	property: string;
	value: any;
	message: string[];
};

export class DomainValidationError extends Error {
	public validationErrors: DomainValidationErrors[];

	constructor(context: Entity, validationErrors: DomainValidationErrors[]) {
		super(`${context.constructor.name} validation failed`);
		this.validationErrors = validationErrors;
	}
}
