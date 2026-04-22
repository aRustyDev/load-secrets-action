const mockGetVariables = jest.fn(() =>
	Promise.resolve({
		variables: [
			{ name: "DB_HOST", value: "localhost", masked: false },
			{ name: "DB_PASSWORD", value: "s3cret", masked: true },
		],
	}),
);

const mockCreateClient = jest.fn(() =>
	Promise.resolve({
		environments: {
			getVariables: mockGetVariables,
		},
	}),
);

module.exports = {
	createClient: mockCreateClient,
	__mockGetVariables: mockGetVariables,
	__mockCreateClient: mockCreateClient,
};
