import { randomUUID } from "crypto";
import { Request, Response } from "express";
import os from "node:os";
import { DestinationStream } from "pino";
import PinoPretty from "pino-pretty";
import { LogMessage } from "../transports/pino-pretty-transport";
// export const pinoConfig: LoggerModuleAsyncParams = {
// 	imports: [],
// 	inject: [ConfigService],
// 	useFactory: (config: ConfigService) => {
// 		const level: string = config.get<string>("LOG_LEVEL") ?? "info";

// 		let stream: DestinationStream | undefined = undefined;
// 		if (config.get<boolean>("LOG_TO_CONSOLE")) {
// 			if (config.get<string>("NODE_ENV") === "development") {
// 				stream = PinoPretty({
// 					colorize: true,
// 					singleLine: false,
// 					messageFormat(log: LogMessage, messageKey: string, _, { colors }) {
// 						const formattedContext = log.context
// 							? `${colors.gray(`[${log.context}]`)} `
// 							: "";

// 						let reqIdPart = "";

// 						if (log.req && typeof log.req === "object") {
// 							if ("id" in log.req && log.req.id) {
// 								reqIdPart = `${colors.yellow(`REQ_ID`)}:${colors.yellowBright(log.req.id)} `;
// 							}
// 						}

// 						const message: string = log[messageKey] as string;

// 						return `${formattedContext}${reqIdPart}– ${message}`;
// 					},
// 				});
// 			}
// 		}

// 		return {
// 			pinoHttp: {
// 				level: level,
// 				enabled: config.get<boolean>("LOG_TO_CONSOLE"),
// 				genReqId: (req, res) => {
// 					// trace logging
// 					const existingID = req.id ?? req.headers["X-Request-Id"];
// 					if (existingID) return existingID;
// 					const id = randomUUID();
// 					res.setHeader("X-Request-Id", id);
// 					return id;
// 				},
// 				autoLogging: config.get<boolean>("LOG_AUTO_LOGGING"),
// 				quietReqLogger: config.get<boolean>("LOG_QUIET_REQ_LOGGER"),
// 				quietResLogger: config.get<boolean>("LOG_QUIET_RES_LOGGER"),
// 				stream: stream,
// 				base: {
// 					pid: process.pid,
// 					hostname: os.hostname(),
// 					app: config.get<string>("APP_NAME"),
// 					context: config.get<string>("APP_NAME"),
// 					env: config.get<string>("NODE_ENV"),
// 				},
// 			},
// 		};
// 	},
// };

export type PinoConfigOptions = {
	nodeEnv: string;
	appName: string;
	logLevel: string;
	logToConsole: boolean;
	autoLogging: boolean;
	quietReqLogger: boolean;
	quietResLogger: boolean;
};

export function getPinoConfig(options: PinoConfigOptions) {
	const level: string = options.logLevel ?? "info";

	let stream: DestinationStream | undefined = undefined;
	if (options.logToConsole) {
		if (options.nodeEnv === "development") {
			stream = PinoPretty({
				colorize: true,
				singleLine: false,
				messageFormat(log: LogMessage, messageKey: string, _, { colors }) {
					const formattedContext = log.context
						? `${colors.gray(`[${log.context}]`)} `
						: "";

					let reqIdPart = "";

					if (log.req && typeof log.req === "object") {
						if ("id" in log.req && log.req.id) {
							reqIdPart = `${colors.yellow(`REQ_ID`)}:${colors.yellowBright(log.req.id)} `;
						}
					}

					const message: string = log[messageKey] as string;

					return `${formattedContext}${reqIdPart}– ${message}`;
				},
			});
		}
	}

	return {
		pinoHttp: {
			level: level,
			enabled: options.logToConsole,
			genReqId: (req: Request, res: Response) => {
				// trace logging
				const existingID = req.id ?? req.headers["X-Request-Id"];
				if (existingID) return existingID;
				const id = randomUUID();
				res.setHeader("X-Request-Id", id);
				return id;
			},
			autoLogging: options.autoLogging,
			quietReqLogger: options.quietReqLogger,
			quietResLogger: options.quietResLogger,
			stream: stream,
			base: {
				pid: process.pid,
				hostname: os.hostname(),
				app: options.appName,
				context: options.appName,
				env: options.nodeEnv,
			},
		},
	};
}
