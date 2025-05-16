export const setCookieSwaggerHeader = {
	"Set-Cookie": {
		description: "Установка нового refresh token",
		schema: {
			type: "string",
			example: "refreshToken=your_refresh_token; HttpOnly; Path=/; Max-Age=3600",
		},
	},
};
