import { ChangeEvent, useState } from 'react';
import APIService from '../../utils/ApiService';
import './FileUpload.scss';
import {
	useShowNotification,
	useShowChoiceNotification,
} from '../../providers/NotificationProvider';
import { useGetOrganizations } from '../../providers/OrganizationProvider';
import FileViewer from '../FileViewer/FileViewer';
import { useSetLoadingScreen } from '../../providers/LoadingScreenProvider';
import Organization from '../../types/Organization';
import Icon from '../Icon/Icon';

interface Props {
	organizationProp: Organization | undefined;
	afterUpload?: () => void;
}

/**
 * A component where the user can upload files
 */
function FileUpload({ organizationProp, afterUpload }: Props) {
	const [files, setFiles] = useState<File[]>([]);
	const [viewFile, setViewFile] = useState<File | undefined>(undefined);
	const [stagedFiles, setstagedFiles] = useState<File[]>([]);
	const [selectedOrg, setSelectedOrg] = useState(organizationProp?.id ?? -1);

	const getOrganizations = useGetOrganizations();
	const showNotification = useShowNotification();
	const showChoiceNotification = useShowChoiceNotification();
	const setLoadingScreen = useSetLoadingScreen();

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = event.target.files;
		if (selectedFiles === null) return;
		setstagedFiles([...selectedFiles, ...Array.from(stagedFiles)]);
	};

	const addFile = (force: boolean = false) => {
		if (stagedFiles.length === 0) {
			return;
		}
		if (!force) {
			for (const stagedFile of stagedFiles) {
				for (const file of files) {
					if (
						file.name === stagedFile.name &&
						file.size === stagedFile.size &&
						file.lastModified === stagedFile.lastModified
					) {
						showChoiceNotification(
							'File upload',
							`The file ${stagedFile.name} is already in the list. Do you want to add it anyway?`,
							() => addFile(true),
							() => {},
							'Yes',
							'No'
						);
						return;
					}
				}
			}
		}

		setFiles([...files, ...stagedFiles]);
		setstagedFiles([]);
	};

	const discardFiles = () => {
		setstagedFiles([]);
	};

	const removeFile = (index: number) => {
		const newFiles = [...files];
		newFiles.splice(index, 1);
		setFiles(newFiles);
	};

	const handleUpload = () => {
		if (files.length === 0) return;

		let orgId = selectedOrg;
		if (organizationProp !== undefined) {
			orgId = organizationProp.id;
		} else if (orgId === -1) {
			orgId = getOrganizations()[0].id;
		}
		setLoadingScreen(true, 'Uploading files...', 'Please wait');
		APIService.upload(files, orgId).then((res) => {
			setLoadingScreen(false);
			setTimeout(() => {
				showNotification('File upload', res);
				setFiles([]);
				afterUpload?.();
			}, 100);
		});
	};

	if (getOrganizations().length === 0) {
		return (
			<p>
				<i>
					You have to be a member of an organization to upload files.
					You can create a new organization{' '}
					<a href="/organization/create">here</a>.
				</i>
			</p>
		);
	}

	return (
		<div className="FileUpload">
			{viewFile !== undefined && (
				<FileViewer
					file={viewFile}
					onClose={() => {
						setViewFile(undefined);
					}}
				/>
			)}
			{(organizationProp === undefined && getOrganizations().length) ===
				1 && (
				<p>
					Organization:{' '}
					<b className="ml">{getOrganizations()[0].name}</b>
				</p>
			)}
			{organizationProp == undefined && getOrganizations().length > 1 && (
				<div className="hor mb">
					<p>
						<b>Select an Organization:</b>
					</p>
					<select
						className="btn"
						style={{
							marginLeft: '20px',
							padding: '5px',
						}}
						name="organization"
						id="organization"
						onChange={(e) => {
							const name = e.target.value;
							const organization = getOrganizations().find(
								(org) => org.name === name
							);
							if (organization === undefined) return;
							setSelectedOrg(organization.id);
						}}
					>
						{getOrganizations().map((organization) => (
							<option
								value={organization.name}
								key={organization.id}
							>
								{organization.name}
							</option>
						))}
					</select>
				</div>
			)}
			<div className="hor mb">
				<input
					type="file"
					onChange={handleFileChange}
					accept=".txt,.bson"
					multiple={true}
				/>
			</div>
			<div className="hor mb">
				<button className="btn" onClick={() => addFile()}>
					Add
				</button>
				<button className="btn" onClick={discardFiles}>
					Discard
				</button>
			</div>
			{files.map((file, index) => (
				<li className="file" key={index}>
					<div className="dot"></div>
					<p>{file.name}</p>
					<Icon
						cls="bi bi-eye icon"
						onClicked={() => setViewFile(file)}
					>
						View Document
					</Icon>
					<Icon
						cls="bi bi-x-circle icon"
						onClicked={() => removeFile(index)}
					>
						Remove Document
					</Icon>
				</li>
			))}
			<div className="ver">
				{files.length > 0 && (
					<button
						className="btn uploadFile"
						style={{ width: '220px' }}
						onClick={handleUpload}
						disabled={files.length === 0}
					>
						<i className="bi bi-cloud-arrow-up-fill icon mr"></i>
						Upload
					</button>
				)}
			</div>
		</div>
	);
}
export default FileUpload;
