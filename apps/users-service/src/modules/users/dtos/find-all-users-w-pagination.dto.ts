import { Nullable } from "../../../core/types/utility.types";
import { UserPublicResponseDTO } from "./responses/user-public.response.dto";

export interface FindAllUsersWithPaginationInputDTO {
	login?: string;
	take: number;
	skip: number;
	orderBy: "asc" | "desc";
}

export interface FindAllUsersWithPaginationOutputDTO {
	data: UserPublicResponseDTO[];
	total: number;
}

export interface FindAllUsersWithPaginationRepositoryResultDTO {
	total: number;
	data: {
		id: string;
		login: string;
		age: number;
		about: Nullable<string>;
		activeAvatar: Nullable<{
			id: string;
			path: string;
			active: boolean;
			createdAt: Date;
			userId: string;
		}>;
	}[];
}
