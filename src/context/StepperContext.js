import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const SESSION_KEY = 'campaignStepperState';

const defaultState = {
	currentStep: 1,
	selectedChannel: 'whatsapp',
	message: '',
	selectedTemplates: [],
	sendDate: '',	
	sendTime: '',
	distributeDays: '',
	audience: [],
	datasource: '',
	// marketingSettings: false,
	// steps: ['Select a channel', 'Choose your audience', 'Write your message', 'Set a send date', 'Setup retires for marketing', 'Set live'],
	steps: ['Select a channel', 'Write your message', 'Choose your audience', 'Set a send date', 'Set live'],
	utmParameters: '',
	conversionGoal: '',
};

const StepperContext = createContext(undefined);

export const StepperProvider = ({ children }) => {
	const [state, setState] = useState(() => {
		try {
			const raw = sessionStorage.getItem(SESSION_KEY);
			if (!raw) return defaultState;
			const parsed = JSON.parse(raw);
			return { ...defaultState, ...parsed };
		} catch {
			return defaultState;
		}
	});

	useEffect(() => {
		try {
			sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
		} catch { }
	}, [state]);

	const actions = useMemo(() => ({
		setCurrentStep: (step) => setState((s) => ({ ...s, currentStep: step })),
		setMessage: (msg) => setState((s) => ({ ...s, message: msg })),
		setSelectedChannel: (channel) => setState((s) => ({ ...s, selectedChannel: channel })),
		setSelectedTemplates: (templates) => setState((s) => {
			// If templates is not an array, return current state
			if (!Array.isArray(templates)) return s;

			// Create a new array with the template objects
			return {
				...s,
				selectedTemplates: templates
			};
		}),
		setSendDate: (date) => setState((s) => ({ ...s, sendDate: date })),
		setSendTime: (time) => setState((s) => ({ ...s, sendTime: time })),
		setDistributeDays: (days) => setState((s) => ({ ...s, distributeDays: days })),
		setAudience: (aud) => setState((s) => ({ ...s, audience: aud })),
		setDatasource: (datasource) => setState((s) => ({ ...s, datasource: datasource })),
		// setMarketingSettings: (val) => setState((s) => ({ ...s, marketingSettings: !!val })),
		setUtmParameters: (val) => setState((s) => ({ ...s, utmParameters: val })),
		setConversionGoal: (val) => setState((s) => ({ ...s, conversionGoal: val })),

		reset: () => setState(defaultState),
		goNext: () => setState((s) => ({ ...s, currentStep: Math.min(s.currentStep + 1, s.steps.length) })),
		goPrev: () => setState((s) => ({ ...s, currentStep: Math.max(s.currentStep - 1, 1) })),
	}), []);

	const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

	return (
		<StepperContext.Provider value={value}>
			{children}
		</StepperContext.Provider>
	);
};

export const useStepper = () => {
	const ctx = useContext(StepperContext);
	if (!ctx) {
		throw new Error('useStepper must be used within a StepperProvider');
	}
	return ctx;
}; 