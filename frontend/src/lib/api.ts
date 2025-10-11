const api = (url, options = {}) => {
	return fetch(`/api/${url}`, {
		...options,
		credentials: "include",
	});
};

export { api };
