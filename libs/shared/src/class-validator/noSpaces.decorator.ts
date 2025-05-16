import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export function NoSpaces(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: "noSpaces",
			target: object.constructor,
			propertyName: propertyName,
			constraints: [],
			options: validationOptions,
			validator: {
				validate(value: any) {
					if (typeof value !== "string") {
						return false;
					}

					return !/\s/.test(value);
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} cannot contain spaces`;
				},
			},
		});
	};
}
