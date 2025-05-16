import { Nullable } from "../../../core/types/utility.types";

export type CachedUser = {
	id: string;
	login: string;
	email: string;
	age: number;
	about: Nullable<string>;
	activeAvatar: Nullable<CachedAvatar>;
	createdAt: Date;
};

export type CachedAvatar = {
	id: string;
	userId: string;
	path: string;
	active: boolean;
	createdAt: Date;
};
