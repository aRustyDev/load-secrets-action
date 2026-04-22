import * as core from "@actions/core";
import { createClient } from "@1password/sdk";
import { envManagedVariables, envServiceAccountToken } from "./constants";

/**
 * Load all variables from a 1Password Environment using the JS SDK.
 *
 * This is an alternative to the op CLI path used by loadSecrets().
 * When `environment-id` input is provided, this function is called
 * instead of the CLI-based flow.
 * @param environmentId - The 1Password Environment ID to load variables from.
 * @param shouldExportEnv - Whether to export variables as environment variables or step outputs.
 */
export const loadEnvironmentSecrets = async (
	environmentId: string,
	shouldExportEnv: boolean,
): Promise<void> => {
	const token = process.env[envServiceAccountToken];
	if (!token) {
		throw new Error(
			`${envServiceAccountToken} is required when using environment-id.`,
		);
	}

	core.info(`Loading secrets from 1Password Environment: ${environmentId}`);

	const client = await createClient({
		auth: token,
		integrationName: "1Password GitHub Action",
		integrationVersion: "v1.0.0",
	});

	const response = await client.environments.getVariables(environmentId);

	if (!response.variables || response.variables.length === 0) {
		core.warning(
			`No variables found in 1Password Environment: ${environmentId}`,
		);
		return;
	}

	const managedEnvNames: string[] = [];

	for (const { name, value } of response.variables) {
		core.info(`Populating variable: ${name}`);

		// Mask non-empty values in logs
		if (value) {
			core.setSecret(value);
		}

		if (shouldExportEnv) {
			core.exportVariable(name, value);
		} else {
			core.setOutput(name, value);
		}

		managedEnvNames.push(name);
	}

	if (shouldExportEnv) {
		core.exportVariable(envManagedVariables, managedEnvNames.join());
	}

	core.info(
		`Loaded ${response.variables.length} variables from 1Password Environment.`,
	);
};
