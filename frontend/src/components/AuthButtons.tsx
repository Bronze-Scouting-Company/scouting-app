export function AuthButtons() {
	return (
		<div className="flex gap-2">
			<a
				href="/api/auth/login/google"
				className="px-3 py-2 rounded bg-black text-white"
			>
				Login Google
			</a>
			<a
				href="/api/auth/login/discord"
				className="px-3 py-2 rounded bg-indigo-600 text-white"
			>
				Login Discord
			</a>
		</div>
	);
}
