import { useContext, createContext } from 'react';
import { ReactNode } from 'react';

export interface WidgetConfig {
    botName?: string;
    primaryColor?: string;
    welcomeMessage?: string;
}

export const widgetConfigDefault: WidgetConfig = {
    botName: "AI assistant",
    primaryColor: "#4a90e2",
    welcomeMessage: "Привет, чем могу помочь?"
}

declare global {
    interface Window {
        WIDGET_CONFIG?: Partial<WidgetConfig>; // Partial значит, что поля могут быть не все
    }
}

export const WidgetConfigContext = createContext<WidgetConfig>(widgetConfigDefault);

export function WidgetConfigProvider({ children} : { children: ReactNode }) {
    const config: WidgetConfig = {
            ...widgetConfigDefault,
            ...(typeof window !== "undefined" ? window.WIDGET_CONFIG : {})
    }

    return (
        <WidgetConfigContext.Provider value={config}>
            {children}
        </WidgetConfigContext.Provider>
    )
}

export function useWidgetConfig() {
    return useContext(WidgetConfigContext);
}
