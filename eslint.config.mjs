// @ts-check
import eslint from "@eslint/js";
import github from "eslint-plugin-github";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: ["eslint.config.mjs", "**/dist/**"],
	},
	eslint.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	eslintPluginPrettierRecommended,
	{
		plugins: {
			github,
		},
		rules: {
			"github/array-foreach": "error",
		},
	},
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},
			ecmaVersion: "latest",
			sourceType: "module",
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-floating-promises": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
		},
	},
	{
		files: ["**/*.spec.ts", "**/*.e2e-spec.ts"],
		rules: {
			"@typescript-eslint/unbound-method": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
		},
	}
);
