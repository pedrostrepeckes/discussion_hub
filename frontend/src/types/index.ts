export const Role = {
    REGULAR: "regular",
    MODERATOR: "moderator",
    ADMIN: "admin",
} as const;
export type Role = typeof Role[keyof typeof Role];

export const ResponseType = {
    CONCORDO: "concordo",
    DISCORDO: "discordo",
} as const;
export type ResponseType = typeof ResponseType[keyof typeof ResponseType];

export const ApprovalStatus = {
    PENDENTE: "pendente",
    APROVADA: "aprovada",
    REJEITADA: "rejeitada",
} as const;
export type ApprovalStatus = typeof ApprovalStatus[keyof typeof ApprovalStatus];

export const DiscussionStatus = {
    ATIVA: "ativa",
    FINALIZADA: "finalizada",
} as const;
export type DiscussionStatus = typeof DiscussionStatus[keyof typeof DiscussionStatus];

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
}

export interface Discussion {
    id: number;
    title: string;
    content: string;
    status: DiscussionStatus;
    user_id: number;
    created_at: string; // ISO string
    author?: User;
}

export interface Response {
    id: number;
    discussion_id: number;
    user_id: number;
    content: string;
    type: ResponseType;
    status_aprovacao: ApprovalStatus;
    parent_id?: number | null;
    is_reliable_source: boolean;
    upvotes: number;
    downvotes: number;
    created_at: string; // ISO string
    author?: User;
    replies?: Response[];
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}
