import { useAuth } from "../auth/useAuth.tsx";

export function UserMenu() {
	const { user } = useAuth();
	if (!user) return null;
	return (
		<div className="flex items-center gap-2">
			{user.avatarUrl ? (
				<img
					src={user.avatarUrl}
					className="h-8 w-8 rounded-full"
					alt="User Avatar URL"
				/>
			) : (
				<div className="h-8 w-8 rounded-full bg-gray-300" />
			)}
			<span>{user.username ?? user.email}</span>
			<form method="post" action="/api/auth/logout">
				<button className="px-2 py-1 border rounded">Logout</button>
			</form>
		</div>
	);
}
