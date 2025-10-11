import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./auth/useAuth";
import { AuthButtons } from "./components/AuthButtons";
import { UserMenu } from "./components/UserMenu";
import "./App.css";

const qc = new QueryClient();

function Header() {
	const { user } = useAuth();
	return (
		<header className="flex justify-between p-4 border-b">
			<h1>BSC</h1>
			{user ? <UserMenu /> : <AuthButtons />}
		</header>
	);
}

function App() {
	return (
		<QueryClientProvider client={qc}>
			<AuthProvider>
				<Header />
				{/* routes */}
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;
