import axios from 'axios';
import Organization from '../types/Organization';
import MyDocument from '../types/MyDocument';
import Logger from './Logger';

/**
 * This class is used to make requests to the backend API.
 */
class APIService {
	static host = import.meta.env.VITE_API_URL;

	/**
	 * Check if the user can login with the given credentials.
	 * @param schema The username to login
	 * @returns A promise that resolves to true if the login was successful, false otherwise.
	 */
	static async login(username: string, password: string): Promise<boolean> {
		try {
			const url = `${this.host}/login`;
			const resp = await axios
				.post(url, {
					username: username,
					password: password,
				})
				.catch(this.handleCatch);
			if (resp.status === 200) {
				sessionStorage.setItem('user-token', resp.data.token);
				return true;
			}

			this.clearUserToken();
			return false;
		} catch (e) {
			Logger.error(e);

			this.clearUserToken();
			return false;
		}
	}

	/**
	 * Check if the user can register with the given credentials.
	 * @param username The username to register
	 * @param password The password to register
	 * @returns A promise that resolves to true if the registration was successful, false otherwise.
	 */
	static async register(
		username: string,
		password: string,
		addOrg = true
	): Promise<boolean | undefined> {
		try {
			const url = `${this.host}/register`;
			const resp = await axios.post(url, {
				username: username,
				password: password,
			});
			if (resp.status === 201) {
				const token = resp.data.token;
				sessionStorage.setItem('user-token', token);
				if (addOrg) {
					await this.createOrganization(username + 'Org');
				}
				return true;
			}
			return false;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Check if the user can register with the given credentials.
	 * @param username The username to register
	 * @param password The password to register
	 * @returns A promise that resolves to true if the registration was successful, false otherwise.
	 */
	static async deleteUser(
		username: string,
		password: string
	): Promise<boolean> {
		try {
			const url = `${this.host}/deleteUser`;
			const resp = await axios
				.post(
					url,
					{
						username: username,
						password: password,
					},
					{
						headers: {
							Authorization: this.getUserToken(),
						},
					}
				)
				.catch(this.handleCatch);

			if (resp.status === 204) {
				this.clearUserToken();
				return true;
			}
			return false;
		} catch (err) {
			return false;
		}
	}

	/**
	 * Get all organizations the user is part of.
	 * @returns A promise that resolves to all organizations id the user is part of
	 */
	static async getOrganizations(): Promise<number[] | undefined> {
		try {
			const url = `${this.host}/getOrganisations`;
			const resp = await axios
				.get(url, {
					headers: {
						Authorization: this.getUserToken(),
					},
				})
				.catch(this.handleCatch);
			if (resp.status == 401) {
				Logger.error('Unauthorized');
			}
			if (resp.status == 200) {
				return resp.data.organisation_ids as number[];
			}
			if (resp.status == 204) return undefined;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Get all organizations the user is part of.
	 * @returns A promise that resolves to all organizations the user is part of
	 */
	static async getOrganizationNames(): Promise<Organization[] | undefined> {
		try {
			const url = `${this.host}/getOrganisationNames`;
			const resp = await axios
				.get<{
					organisations: Organization[];
				}>(url, {
					headers: {
						Authorization: this.getUserToken(),
					},
				})
				.catch(this.handleCatch);

			if (resp.status == 200) {
				return resp.data.organisations;
			}
			if (resp.status == 404) return undefined;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Search for usernames that start with the given prefix.
	 * @param prefix The prefix of the username to search for
	 * @returns A list of usernames that start with the given prefix
	 */
	static async getUserNameSuggestion(prefix: string): Promise<string[]> {
		try {
			const url = `${this.host}/get/user/suggestion/${prefix}`;
			const resp = await axios
				.get(url, {
					headers: {
						Authorization: this.getUserToken(),
					},
				})
				.catch(this.handleCatch);
			if (resp.status == 200) {
				return resp.data.usernames as string[];
			}
			return [];
		} catch (err) {
			Logger.error(err);
			return [];
		}
	}

	/**
	 * Get the name of an organization with the given id.
	 * @param id THe id of the organization
	 * @returns A promise that resolves to the name of the organization with the given id
	 */
	static async getNameForOrganization(
		id: number
	): Promise<string | undefined> {
		try {
			const url = `${this.host}/getOrganisationName/${id}`;
			const resp = await axios
				.get(url, {
					headers: {
						Authorization: this.getUserToken(),
					},
				})
				.catch(this.handleCatch);
			if (resp.status == 200) {
				return resp.data.organisation_name as string;
			}
			if (resp.status == 404) return undefined;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Create a new organization.
	 * @param orgName The name of the organization to create
	 * @returns The ID of the created organization or undefined if the creation failed
	 */
	static async createOrganization(
		orgName: string
	): Promise<number | undefined> {
		try {
			const url = `${this.host}/createOrganisation`;
			const resp = await axios
				.post(
					url,
					{
						organisationName: orgName,
					},
					{
						headers: {
							Authorization: this.getUserToken(),
						},
					}
				)
				.catch(this.handleCatch);
			if (resp.status === 200) {
				sessionStorage.setItem(
					'organisation',
					JSON.stringify({
						name: orgName,
						id: resp.data.organisation_id as number,
					})
				);
				return resp.data.organisation_id as number;
			}
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Create a new organization.
	 * @param orgName The name of the organization to create
	 * @returns The ID of the created organization or undefined if the creation failed
	 */
	static async leaveOrganization(orgId: number): Promise<boolean> {
		try {
			const url = `${this.host}/leaveOrganisation`;
			const resp = await axios
				.post(
					url,
					{
						organisationId: orgId,
					},
					{
						headers: {
							Authorization: this.getUserToken(),
						},
					}
				)
				.catch(this.handleCatch);
			if (resp.status === 200) {
				return resp.data.status;
			}
			return false;
		} catch (err) {
			Logger.error(err);
			return false;
		}
	}

	/**
	 * Get all members of an organization.
	 * @param orgId The ID of the organization
	 * @returns A string array with the usernames of all members of the organization
	 * 			or undefined if the organization does not exist or something went wrong
	 */
	static async getMembersForOrganization(
		orgId: number
	): Promise<string[] | undefined> {
		try {
			const url = `${this.host}/getOrganisationMembers/${orgId}`;
			const resp = await axios
				.get(url, {
					headers: {
						Authorization: this.getUserToken(),
					},
				})
				.catch(this.handleCatch);
			if (resp.status === 200) {
				return resp.data.members as string[];
			}
			return undefined;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Add a new member to an organization.
	 * @param orgId The id of the organization
	 * @param newUsername The username of the user to add
	 * @returns The error message or an empty string if the user was added successfully
	 */
	static async addMemberToOrganization(
		orgId: number,
		newUsername: string
	): Promise<string> {
		const url = `${this.host}/addUserToOrganisation`;
		const resp = await axios
			.post(
				url,
				{
					organisationId: orgId,
					newUser: newUsername,
				},
				{
					headers: {
						Authorization: this.getUserToken(),
					},
				}
			)
			.catch(this.handleCatch);
		if (resp.status === 200) {
			return '';
		}

		return resp.data.error;
	}

	/**
	 * Upload files to the server.
	 * @param data Array of files to upload
	 * @param organisationId id of the Organisation to upload files to
	 * @returns A string with the status of the upload
	 */
	static async upload(data: Blob[], organisationId: number): Promise<string> {
		try {
			const body = new FormData();
			for (let i = 0; i < data.length; i++) {
				body.append('file', data[i]);
			}
			body.append('organisationId', organisationId.toString());

			const resp = await axios
				.post(`${this.host}/data/upload/file`, body, {
					headers: {
						'Content-Type': 'multipart/form-data',
						Authorization: this.getUserToken(),
					},
				})
				.catch(this.handleCatch);
			if (resp.status === 201) {
				return 'File uploaded successfully';
			}
			if (resp.status === 207) {
				return 'File uploaded partially successfully';
			}
			return 'Error uploading file';
		} catch (err) {
			Logger.error(err);
			return 'Error uploading file';
		}
	}

	/**
	 * Get all documents that are uploaded for the corresponding organization.
	 * @param organizationID The ID of the organization
	 * @returns A promise that resolves to all documents of the organization
	 */
	static async getDocumentForOrganization(
		organizationID: number
	): Promise<MyDocument[]> {
		try {
			const response = await axios
				.get(
					`${this.host}/data/organization/get/files/${organizationID}`,
					{
						headers: {
							Authorization: this.getUserToken(),
						},
					}
				)
				.catch(this.handleCatch);
			if (response.status === 200) {
				return response.data as MyDocument[];
			}
			return [];
		} catch (err) {
			Logger.error(err);
			return [];
		}
	}

	/**
	 * Get all document base that are created for the corresponding organization.
	 * @param organizationID The ID of the organization
	 * @returns A promise that resolves to all document bases of the organization
	 */
	static async getDocumentBaseForOrganization(
		organizationID: number
	): Promise<MyDocument[]> {
		// NILS MACH MA TEST
		try {
			const response = await axios
				.get(
					`${this.host}/data/organization/get/documentbase/${organizationID}`,
					{
						headers: {
							Authorization: this.getUserToken(),
						},
					}
				)
				.catch(this.handleCatch);
			if (response.status === 200) {
				return response.data as MyDocument[];
			}
			return [];
		} catch (err) {
			Logger.error(err);
			return [];
		}
	}

	/**
	 * Update the content of a document.
	 * @param documentId The ID of the document
	 * @param newContent The new content of the document
	 * @returns If the update was successful
	 */
	static async updateDocumentContent(
		documentId: number,
		newContent: string
	): Promise<boolean> {
		try {
			const response = await axios
				.post(
					`${this.host}/data/update/file/content`,
					{
						documentId: documentId,
						newContent: newContent,
					},
					{
						headers: {
							Authorization: this.getUserToken(),
						},
					}
				)
				.catch(this.handleCatch);
			if (response.status === 200) {
				return response.data.status;
			}
			return false;
		} catch (err) {
			Logger.error(err);
			return false;
		}
	}

	/**
	 * Delete a document.
	 * @param documentId The ID of the document
	 * @returns If the deletion was successful
	 */
	static async deleteDocument(documentId: number): Promise<boolean> {
		try {
			const response = await axios
				.post(
					`${this.host}/data/file/delete`,
					{
						documentId: documentId,
					},
					{
						headers: {
							Authorization: this.getUserToken(),
						},
					}
				)
				.catch(this.handleCatch);
			if (response.status === 200) {
				return response.data.status;
			}
			return false;
		} catch (err) {
			Logger.error(err);
			return false;
		}
	}

	/**
	 * Create a new documentbase.
	 * @param organizationId The ID of the organization
	 * @param baseName The name for the docbase
	 * @param documentIDs An array of the document IDs that should be used for the docbase
	 * @param attributes An array of the attributes that should be used for the docbase
	 * @returns The ID of the created task or undefined if the creation failed
	 */
	static async createDocumentBase(
		organizationId: number,
		baseName: string,
		documentIDs: number[],
		attributes: string[]
	): Promise<string | undefined> {
		try {
			const url = `${this.host}/core/document_base`;

			const body = new FormData();
			body.append('organisationId', organizationId.toString());
			body.append('baseName', baseName);
			body.append('document_ids', documentIDs.join(','));
			body.append('attributes', attributes.join(','));
			body.append('authorization', this.getUserToken());
			const resp = await axios.post(url, body).catch(this.handleCatch);
			return resp.data.task_id;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Update the attributes of a documentbase.
	 * @param organizationId The ID of the organization
	 * @param baseName The name for the docbase
	 * @param attributes An array of the new attributes that should be used for the docbase
	 * @returns The ID of the created task or undefined if the creation failed
	 */
	static async updateDocumentBaseAttributes(
		organizationId: number,
		baseName: string,
		newAttributes: string[]
	): Promise<string | undefined> {
		try {
			const url = `${this.host}/core/document_base/attributes/update`;

			const body = new FormData();
			body.append('authorization', this.getUserToken());
			body.append('organisationId', organizationId.toString());
			body.append('baseName', baseName);
			body.append('attributes', newAttributes.join(','));
			const resp = await axios.post(url, body).catch(this.handleCatch);
			return resp.data.task_id;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Create a new documentbase.
	 * @param organizationId The ID of the organization
	 * @param baseName The name for the docbase
	 * @param documentIDs An array of the document IDs that should be used for the docbase
	 * @param attributes An array of the attributes that should be used for the docbase
	 * @returns The ID of the created task or undefined if the creation failed
	 */
	static async loadDocumentBase(
		organizationId: number,
		baseName: string
	): Promise<string | undefined> {
		try {
			const url = `${this.host}/core/document_base/load`;

			const body = new FormData();
			body.append('organisationId', organizationId.toString());
			body.append('baseName', baseName);
			body.append('authorization', this.getUserToken());
			const resp = await axios.post(url, body).catch(this.handleCatch);
			return resp.data.task_id;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Start the interactive table population task
	 * @param organizationId The ID of the organization
	 * @param baseName The name of the docbase
	 * @returns The task ID
	 */
	static async interactiveTablePopulation(
		organizationId: number,
		baseName: string
	): Promise<string | undefined> {
		try {
			const url = `${this.host}/core/document_base/interactive`;

			const body = new FormData();
			body.append('organisationId', organizationId.toString());
			body.append('baseName', baseName);
			body.append('authorization', this.getUserToken());
			const resp = await axios.post(url, body).catch(this.handleCatch);
			return resp.data.task_id;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Start the task to get order the nuggets
	 * @param organizationId The ID of the organization
	 * @param baseName The name of the docbase
	 * @param documentName The name of the document
	 * @param documentContent The content of the document
	 * @returns The task ID
	 */
	static async getOrderedNuggets(
		organizationId: number,
		baseName: string,
		documentName: string,
		documentContent: string
	): Promise<string | undefined> {
		try {
			const url = `${this.host}/core/document_base/order/nugget`;

			const body = new FormData();
			body.append('authorization', this.getUserToken());
			body.append('organisationId', organizationId.toString());
			body.append('baseName', baseName);
			body.append('documentName', documentName);
			body.append('documentContent', documentContent);
			const resp = await axios.post(url, body).catch(this.handleCatch);
			return resp.data.task_id;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Confirm a match nugget
	 * @param organizationId The ID of the organization
	 * @param baseName The name of the docbase
	 * @param documentName The name of the document
	 * @param documentContent The content of the document
	 * @param nuggetText The text of the nugget
	 * @param startIndex The start index of the nugget
	 * @param endIndex The end index of the nugget
	 * @param interactiveCallTaskId The task ID of the interactive table population task
	 * @returns The task ID
	 */
	static async confirmMatchNugget(
		organizationId: number,
		baseName: string,
		documentName: string,
		documentContent: string,
		nuggetText: string,
		startIndex: number,
		endIndex: number,
		interactiveCallTaskId: string
	): Promise<string | undefined> {
		try {
			const url = `${this.host}/core/document_base/confirm/nugget/match`;

			const body = new FormData();
			body.append('authorization', this.getUserToken());
			body.append('organisationId', organizationId.toString());
			body.append('baseName', baseName);
			body.append('documentName', documentName);
			body.append('documentContent', documentContent);
			body.append('nuggetText', nuggetText);
			body.append('startIndex', startIndex.toString());
			body.append('endIndex', endIndex.toString());
			body.append('interactiveCallTaskId', interactiveCallTaskId);
			const resp = await axios.post(url, body).catch(this.handleCatch);
			return resp.data.task_id;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Confirm a custom nugget
	 * @param organizationId The ID of the organization
	 * @param baseName The name of the docbase
	 * @param documentName The name of the document
	 * @param documentContent The content of the document
	 * @param nuggetText The text of the nugget
	 * @param startIndex The start index of the nugget
	 * @param endIndex The end index of the nugget
	 * @param interactiveCallTaskId The task ID of the interactive table population task
	 * @returns The task ID
	 */
	static async confirmCustomNugget(
		organizationId: number,
		baseName: string,
		documentName: string,
		documentContent: string,
		nuggetText: string,
		startIndex: number,
		endIndex: number,
		interactiveCallTaskId: string
	): Promise<string | undefined> {
		try {
			const url = `${this.host}/core/document_base/confirm/nugget/custom`;

			const body = new FormData();
			body.append('authorization', this.getUserToken());
			body.append('organisationId', organizationId.toString());
			body.append('baseName', baseName);
			body.append('documentName', documentName);
			body.append('documentContent', documentContent);
			body.append('nuggetText', nuggetText);
			body.append('startIndex', startIndex.toString());
			body.append('endIndex', endIndex.toString());
			body.append('interactiveCallTaskId', interactiveCallTaskId);
			const resp = await axios.post(url, body).catch(this.handleCatch);
			return resp.data.task_id;
		} catch (err) {
			Logger.error(err);
			return undefined;
		}
	}

	/**
	 * Get the status of a task.
	 * @param taskId The ID for the task
	 * @returns A json object with the status of the task
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static async getTaskStatus(taskId: string): Promise<any> {
		try {
			const url = `${
				this.host
			}/core/status/${this.getUserToken()}/${taskId}`;
			const resp = await axios.get(url).catch(this.handleCatch);
			return resp.data;
		} catch (error) {
			Logger.error(error);

			return undefined;
		}
	}

	/**
	 * Get the authentication token of the current user.
	 * @returns THe authentication token of the current user
	 * @throws Error if the user is not logged in
	 */
	static getUserToken(): string {
		const token = sessionStorage.getItem('user-token');
		if (token == null) {
			Logger.error('User not logged in');
			throw new Error('User not logged in');
		}
		return token;
	}

	/**
	 * Set the authentication token of the current user.
	 * @param token The token
	 */
	static setUserToken(token: string) {
		if (token === '') {
			Logger.error('not a valid token');
			throw new Error('not a valid token');
		}
		sessionStorage.setItem('user-token', token);
	}

	/**
	 * Clear the authentication token of the current user.
	 */
	static clearUserToken() {
		sessionStorage.removeItem('user-token');
		sessionStorage.removeItem('wannadbuser');
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static handleCatch(err: any) {
		Logger.error(err);

		if (err.response.status === 401) {
			Logger.error('Unauthorized!!!');
			// navigate to home page
			APIService.clearUserToken();
			window.location.href = window.location.origin;
		}

		return err.response;
	}
}

export default APIService;
