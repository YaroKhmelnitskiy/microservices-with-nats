import PinoPretty, { PrettyOptions } from "pino-pretty";

export interface LogRequest {
	id?: string;
}

export interface LogMessage {
	req?: LogRequest | null;
	context?: string;
}

export default function pinoPrettyTransport(opts: PrettyOptions) {
	return PinoPretty({
		...opts,
		ignore: "context,hostname,pid",
		messageFormat(log: LogMessage, messageKey: string, _, { colors }) {
			const formattedContext = log.context ? `${colors.gray(`[${log.context}]`)} ` : "";

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
