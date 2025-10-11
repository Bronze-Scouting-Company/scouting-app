import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { createContext, useContext } from "react";
import { api } from "../lib/api";

type Me = {
	user: null | {
		id: string;
		email: string;
		username?: string | null;
		avatarUrl?: string | null;
		roles: string[];
	};
};
const AuthCtx = createContext<Me>({ user: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { data } = useQuery({
		queryKey: ["me"],
		queryFn: async () => api.get("me").json<Me>(),
		staleTime: 60000,
	});
	return (
		<AuthCtx.Provider value={data || { user: null }}>
			{children}
		</AuthCtx.Provider>
	);
}
export function useAuth() {
	return useContext(AuthCtx);
}
