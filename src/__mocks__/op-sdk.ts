const mockGetVariables = jest.fn(async () =>
	Promise.resolve({
		variables: [
			{ name: "DB_HOST", value: "localhost", masked: false },
			{ name: "DB_PASSWORD", value: "s3cret", masked: true },
		],
	}),
);

const mockCreateClient = jest.fn(async () =>
	Promise.resolve({
		environments: {
			getVariables: mockGetVariables,
		},
	}),
);

module.exports = {
	createClient: mockCreateClient,
	mockGetVariables,
	mockCreateClient,
};
