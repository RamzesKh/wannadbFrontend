/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { ReactNode } from 'react';
import DocbaseViewer from '../components/DocbaseViewer/DocbaseViewer';
import DocBase from '../types/DocBase';
import {
	useSetLoadingScreen,
	useSetLoadingScreenLock,
} from './LoadingScreenProvider';
import APIService from '../utils/ApiService';
import { useShowNotification } from './NotificationProvider';
import Logger from '../utils/Logger';
import { MyAudio, usePlayAudio } from './AudioProvider';

const DocBaseTaskContext = React.createContext({
	isDocbaseTaskRunning: (): boolean => {
		return false;
	},
	createDocbaseTask: (
		_organizationId: number,
		_baseName: string,
		_documentIDs: number[],
		_attributes: string[]
	) => {},
	loadDocbaseTask: (_organizationId: number, _baseName: string) => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export function useIsDocbaseTaskRunning() {
	const context = React.useContext(DocBaseTaskContext);
	if (!context) {
		throw new Error(
			'useIsDocbaseTaskRunning must be used within a DocBaseTaskProvider'
		);
	}
	return context.isDocbaseTaskRunning;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCreateDocbaseTask() {
	const context = React.useContext(DocBaseTaskContext);
	if (!context) {
		throw new Error(
			'useCreateDocbaseTask must be used within a DocBaseTaskProvider'
		);
	}
	return context.createDocbaseTask;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLoadDocbaseTask() {
	const context = React.useContext(DocBaseTaskContext);
	if (!context) {
		throw new Error(
			'useLoadDocbaseTask must be used within a DocBaseTaskProvider'
		);
	}
	return context.loadDocbaseTask;
}

interface Props {
	children: ReactNode;
}

/**
 * A provider to run docbase tasks
 */
export function DocBaseTaskProvider({ children }: Props) {
	const setLoadingScreen = useSetLoadingScreen();
	const setLoadingScreenLock = useSetLoadingScreenLock();
	const showNotification = useShowNotification();
	const playAudio = usePlayAudio();

	const intervalTime = 1000;

	const [isRunning, setIsRunning] = React.useState(false);
	const [docBase, setDocBase] = React.useState<DocBase | undefined>(
		undefined
	);

	const createDocbaseTask = async (
		organizationId: number,
		baseName: string,
		documentIDs: number[],
		attributes: string[]
	) => {
		if (isRunning) {
			Logger.warn(
				'Docbase task is already running, cannot start another'
			);
			return;
		}

		// start the task
		const taskId = await APIService.createDocumentBase(
			organizationId,
			baseName,
			documentIDs,
			attributes
		);

		if (taskId == undefined) {
			showNotification('Error', 'Failed to create Docbase ' + baseName);
			return;
		}

		Logger.log('Task: Create Docbase ' + baseName);
		Logger.log('Task ID: ' + taskId);

		sessionStorage.setItem('docbaseId', taskId);
		setLoadingScreen(
			true,
			'Creating Docbase ' + baseName + '...',
			'Please wait...',
			taskId
		);

		setLoadingScreenLock(true);
		setIsRunning(true);

		const updateInterval = setInterval(() => {
			// TODO use type
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			APIService.getTaskStatus(taskId).then((res): any => {
				Logger.log(res);
				if (
					res == undefined ||
					res.state.toUpperCase().trim() === 'FAILURE'
				) {
					setLoadingScreenLock(false);
					setLoadingScreen(false);
					playAudio(MyAudio.ERROR);

					showNotification(
						'Error',
						'Failed to create Docbase ' + baseName
					);
					sessionStorage.removeItem('docbaseId');
					setDocBase(undefined);
					setIsRunning(false);
					clearInterval(updateInterval);
					return;
				}

				if (res.state === 'SUCCESS') {
					setLoadingScreenLock(false);
					setLoadingScreen(false);
					playAudio(MyAudio.SUCCESS);

					const docBase = new DocBase(baseName, attributes);
					for (const nugget of res.meta.document_base_to_ui.msg
						.nuggets) {
						try {
							docBase.addNugget(
								nugget.document.name,
								nugget.document.text,
								nugget.start_char,
								nugget.end_char
							);
						} catch (error) {
							showNotification(
								'Error',
								'Something went wrong translating the nuggets.'
							);
						}
					}
					sessionStorage.removeItem('docbaseId');
					setDocBase(docBase);
					setIsRunning(false);
					clearInterval(updateInterval);
					return;
				}

				let info = res.state;

				if (res.meta.status !== undefined) {
					info = res.meta.status;
				}

				info += info.endsWith('...') ? '' : '...';

				// update loading screen
				setLoadingScreen(
					true,
					'Creating Docbase ' + baseName + '...',
					info,
					taskId,
					true
				);
			});
		}, intervalTime);
	};

	const loadDocbaseTask = async (
		organizationId: number,
		baseName: string
	) => {
		if (isRunning) {
			Logger.warn(
				'Docbase task is already running, cannot start another'
			);
			return;
		}

		// start the task
		const taskId = await APIService.loadDocumentBase(
			organizationId,
			baseName
		);

		if (taskId == undefined) {
			showNotification('Error', 'Failed to load Docbase ' + baseName);
			return;
		}

		Logger.log('Task: Load Docbase ' + baseName);
		Logger.log('Task ID: ' + taskId);

		sessionStorage.setItem('docbaseId', taskId);
		setLoadingScreen(
			true,
			'Loading Docbase ' + baseName + '...',
			'Please wait...',
			taskId
		);

		setLoadingScreenLock(true);
		setIsRunning(true);

		const updateBody = () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			APIService.getTaskStatus(taskId).then((res): any => {
				Logger.log(res);
				if (
					res == undefined ||
					res.state.toUpperCase().trim() === 'FAILURE'
				) {
					setLoadingScreenLock(false);
					setLoadingScreen(false);
					playAudio(MyAudio.ERROR);

					showNotification(
						'Error',
						'Failed to load Docbase ' + baseName
					);
					sessionStorage.removeItem('docbaseId');
					setDocBase(undefined);
					setIsRunning(false);
					clearInterval(updateInterval);
					return;
				}

				if (res.state === 'SUCCESS') {
					setLoadingScreenLock(false);
					setLoadingScreen(false);

					const docBase = new DocBase(
						baseName,
						res.meta.document_base_to_ui.msg.attributes ?? []
					);
					for (const nugget of res.meta.document_base_to_ui.msg
						.nuggets) {
						try {
							docBase.addNugget(
								nugget.document.name,
								nugget.document.text,
								nugget.start_char,
								nugget.end_char
							);
						} catch (error) {
							showNotification(
								'Error',
								'Something went wrong translating the nuggets.'
							);
						}
					}
					sessionStorage.removeItem('docbaseId');
					setDocBase(docBase);
					setIsRunning(false);
					clearInterval(updateInterval);
					return;
				}

				let info = res.state;

				if (res.meta.status !== undefined && res.meta.status !== '') {
					info = res.meta.status;
				}

				info += info.endsWith('...') ? '' : '...';

				// update loading screen
				setLoadingScreen(
					true,
					'Loading Docbase ' + baseName + '...',
					info,
					taskId,
					true
				);
			});
		};
		updateBody();
		const updateInterval = setInterval(updateBody, intervalTime);
	};

	const isDocbaseTaskRunning = () => {
		return isRunning;
	};

	const onClose = () => {
		setDocBase(undefined);
	};

	return (
		<DocBaseTaskContext.Provider
			value={{
				isDocbaseTaskRunning: isDocbaseTaskRunning,
				createDocbaseTask: createDocbaseTask,
				loadDocbaseTask: loadDocbaseTask,
			}}
		>
			{docBase && <DocbaseViewer docBase={docBase} onClose={onClose} />}
			{children}
		</DocBaseTaskContext.Provider>
	);
}
