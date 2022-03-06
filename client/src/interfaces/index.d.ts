export interface ICategory {
    id: string;
    title: string;
}

export interface IPost {
    id: string;
    title: string;
    content: string;
    status: "published" | "draft" | "rejected";
    category: ICategory;
}

export interface IItem {
    id: number;
    version: number;
    description: string;
    value: number;
    currency: string;
    year: number;
    month: number;
    userId: number;
}

export interface IUser {
    id: number;
    version: number;
    username: string;
    email: string;
    name: string;
    enabled: boolean;
}