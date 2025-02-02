import { useEffect, useState } from 'react';
import { useGetOrganizations } from '../../providers/OrganizationProvider';
import Organization from '../../types/Organization';
import './DocBaseOverview.scss';
import APIService from '../../utils/ApiService';
import MyDocument from '../../types/MyDocument';
import { Link } from 'react-router-dom';
import {
	useLoadDocbaseTask,
	useStartInteractiveTablePopulation,
} from '../../providers/DocBaseTaskProvider';
import {
	useShowChoiceNotification,
	useShowNotification,
} from '../../providers/NotificationProvider';
import Icon from '../Icon/Icon';

interface Props {
	organizationProp: Organization | undefined;
	counter: number;
}

/**
 * A list of all DocBases of an organization.
 */
function DocBaseOverview({ organizationProp, counter }: Props) {
	const [docBases, setDocBases] = useState<MyDocument[]>([]);
	const [fileCount, setFileCount] = useState<number>(0);
	const [selectedOrgID, setSelectedOrgID] = useState<number>(-1);
	const [loading, setLoading] = useState<boolean>(true);

	const showChoiceNotification = useShowChoiceNotification();
	const showNotification = useShowNotification();
	const getOrganizations = useGetOrganizations();
	const loadDocbaseTask = useLoadDocbaseTask();
	const startDocBaseInteractiveTablePopulation =
		useStartInteractiveTablePopulation();

	useEffect(() => {
		APIService.getOrganizationNames().then((orgs) => {
			let orgID = -1;
			if (selectedOrgID !== -1) {
				orgID = selectedOrgID;
			} else if (organizationProp !== undefined) {
				orgID = organizationProp.id;
			} else if (orgs !== undefined && orgs.length > 0) {
				orgID = orgs[0].id;
			}
			loadDocBases(orgID);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [organizationProp, counter]);

	const loadDocBases = (orgID: number) => {
		if (orgID === -1) {
			setDocBases([]);
			return;
		}
		APIService.getDocumentBaseForOrganization(orgID).then(
			(response: MyDocument[]) => {
				setDocBases(response);
				setLoading(false);
			}
		);
		APIService.getDocumentForOrganization(orgID).then(
			(response: MyDocument[]) => {
				setFileCount(response.length);
			}
		);
		setSelectedOrgID(orgID);
	};

	const loadDocBase = (document: MyDocument) => {
		loadDocbaseTask(selectedOrgID, document.name);
	};

	const startInteractiveTablePopulation = (document: MyDocument) => {
		startDocBaseInteractiveTablePopulation(selectedOrgID, document.name);
	};

	const removeDocument = (document: MyDocument) => {
		showChoiceNotification(
			'Delete DocBase',
			`Are you sure you want to delete ${document.name}?`,
			() => {
				APIService.deleteDocument(document.id).then((res) => {
					if (!res) {
						showNotification('Error', 'Failed to delete Docbase');
						return;
					}
					loadDocBases(selectedOrgID);
				});
			},
			() => {}
		);
	};

	if (loading) {
		return (
			<p>
				<i>Loading...</i>
			</p>
		);
	}

	if (getOrganizations().length === 0) {
		return (
			<p>
				<i>
					You have to be a member of an organization to create a
					DocBase.
				</i>
			</p>
		);
	}

	return (
		<div className="DocBaseOverview">
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
							loadDocBases(organization.id);
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
			{docBases.length === 0 ? (
				<p>
					<i>You dont have any DocBase yet.</i>
				</p>
			) : (
				<ul>
					{docBases.map((docBase: MyDocument) => (
						<div className="hor" key={docBase.id}>
							<li
								className="my-list-item"
								style={{
									minWidth: '250px',
								}}
							>
								{docBase.name}
							</li>
							<Icon
								cls="bi bi-eye icon"
								onClicked={() => {
									loadDocBase(docBase);
								}}
							>
								View DocBase
							</Icon>
							<Icon
								cls="bi bi-table icon"
								onClicked={() => {
									startInteractiveTablePopulation(docBase);
								}}
							>
								Start interactive table population
							</Icon>
							<Icon
								cls="bi bi-x-circle"
								onClicked={() => {
									removeDocument(docBase);
								}}
							>
								Delete DocBase
							</Icon>
						</div>
					))}
				</ul>
			)}
			{fileCount > 0 && (
				<Link
					className="lnk mt"
					to={'/organization/' + selectedOrgID + '/docbase/new'}
					style={{
						width: '100px',
						paddingTop: '10px',
						paddingBottom: '10px',
					}}
				>
					<i className="bi bi-plus-square icon mr"></i>New
				</Link>
			)}
			{fileCount == 0 && (
				<i>Please upload a document to create a document base.</i>
			)}
		</div>
	);
}
export default DocBaseOverview;
