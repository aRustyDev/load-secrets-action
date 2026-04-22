import * as core from "@actions/core";
import { loadEnvironmentSecrets } from "./environments";
import { envManagedVariables, envServiceAccountToken } from "./constants";

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const { mockGetVariables, mockCreateClient } = require("@1password/sdk");

beforeEach(() => {
	jest.clearAllMocks();
	process.env[envServiceAccountToken] = "ops_test_token";
});

afterEach(() => {
	delete process.env[envServiceAccountToken];
});

describe("loadEnvironmentSecrets", () => {
	const testEnvironmentId = "env_abc123";

	it("should throw if OP_SERVICE_ACCOUNT_TOKEN is not set", async () => {
		delete process.env[envServiceAccountToken];
		await expect(
			loadEnvironmentSecrets(testEnvironmentId, true),
		).rejects.toThrow("OP_SERVICE_ACCOUNT_TOKEN is required");
	});

	it("should create client with service account token", async () => {
		await loadEnvironmentSecrets(testEnvironmentId, true);
		expect(mockCreateClient).toHaveBeenCalledWith({
			auth: "ops_test_token",
			integrationName: "1Password GitHub Action",
			integrationVersion: "v1.0.0",
		});
	});

	it("should call getVariables with the environment ID", async () => {
		await loadEnvironmentSecrets(testEnvironmentId, true);
		expect(mockGetVariables).toHaveBeenCalledWith(testEnvironmentId);
	});

	it("should export variables as env vars when shouldExportEnv is true", async () => {
		await loadEnvironmentSecrets(testEnvironmentId, true);
		expect(core.exportVariable).toHaveBeenCalledWith("DB_HOST", "localhost");
		expect(core.exportVariable).toHaveBeenCalledWith("DB_PASSWORD", "s3cret");
		expect(core.setOutput).not.toHaveBeenCalledWith(
			"DB_HOST",
			expect.anything(),
		);
	});

	it("should set variables as outputs when shouldExportEnv is false", async () => {
		await loadEnvironmentSecrets(testEnvironmentId, false);
		expect(core.setOutput).toHaveBeenCalledWith("DB_HOST", "localhost");
		expect(core.setOutput).toHaveBeenCalledWith("DB_PASSWORD", "s3cret");
		expect(core.exportVariable).not.toHaveBeenCalled();
	});

	it("should mask non-empty secret values", async () => {
		await loadEnvironmentSecrets(testEnvironmentId, true);
		expect(core.setSecret).toHaveBeenCalledWith("localhost");
		expect(core.setSecret).toHaveBeenCalledWith("s3cret");
	});

	it("should not call setSecret for empty values", async () => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		mockGetVariables.mockResolvedValueOnce({
			variables: [{ name: "EMPTY", value: "", masked: false }],
		});
		await loadEnvironmentSecrets(testEnvironmentId, true);
		expect(core.setSecret).not.toHaveBeenCalled();
	});

	it("should track managed variables when exporting env", async () => {
		await loadEnvironmentSecrets(testEnvironmentId, true);
		expect(core.exportVariable).toHaveBeenCalledWith(
			envManagedVariables,
			"DB_HOST,DB_PASSWORD",
		);
	});

	it("should warn when no variables found", async () => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		mockGetVariables.mockResolvedValueOnce({ variables: [] });
		await loadEnvironmentSecrets(testEnvironmentId, true);
		expect(core.warning).toHaveBeenCalledWith(
			expect.stringContaining("No variables found"),
		);
	});
});
