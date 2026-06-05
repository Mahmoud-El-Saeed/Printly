import type {
	BookCreate,
	BookListResponse,
	BookResponse,
	BooksRequest,
	BookUpdate,
} from "@/types";
import apiClient from "./client";

export const booksApi = {
	list: async (params?: BooksRequest): Promise<BookListResponse> => {
		const response = await apiClient.get<BookListResponse>("/books/", {
			params,
		});
		return response.data;
	},

	get: async (bookId: string): Promise<BookResponse> => {
		const response = await apiClient.get<BookResponse>(`/books/${bookId}`);
		return response.data;
	},

	create: async (data: BookCreate): Promise<BookResponse> => {
		const response = await apiClient.post<BookResponse>("/books/", data);
		return response.data;
	},

	update: async (bookId: string, data: BookUpdate): Promise<BookResponse> => {
		const response = await apiClient.put<BookResponse>(
			`/books/${bookId}`,
			data,
		);
		return response.data;
	},

	delete: async (bookId: string): Promise<void> => {
		await apiClient.delete(`/books/${bookId}`);
	},

	uploadFile: async (bookId: string, file: File): Promise<BookResponse> => {
		const formData = new FormData();
		formData.append("file", file);
		const response = await apiClient.post<BookResponse>(
			`/books/${bookId}/file`,
			formData,
			{ headers: { "Content-Type": "multipart/form-data" } },
		);
		return response.data;
	},

	downloadFile: async (bookId: string): Promise<Blob> => {
		const response = await apiClient.get(`/books/${bookId}/file`, {
			responseType: "blob",
		});
		return response.data;
	},

	deleteFile: async (bookId: string): Promise<void> => {
		await apiClient.delete(`/books/${bookId}/file`);
	},
};
