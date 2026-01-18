import { useContext, createContext, useState, useEffect } from 'react';
import { ReactNode } from 'react';

export interface WidgetConfig {
    project_id: string;
    botName: string;
    primaryColor: string;
    welcomeMessage: string;
}

export const widgetConfigDefault: WidgetConfig = {
    project_id: "local_project_id",
    botName: "AI assistant",
    primaryColor: "#4a90e2",
    welcomeMessage: "Привет, чем могу помочь?"
}
declare global {
    interface Window {
        WIDGET_CONFIG?: Partial<WidgetConfig>;
    }
}

export interface WidgetContextType extends WidgetConfig {
    isLoading: boolean;
}

const WidgetConfigContext = createContext<WidgetContextType>({
    ...widgetConfigDefault,
    isLoading: true
});

export function WidgetConfigProvider({ children, projectId } : { children: ReactNode, projectId: string }) {
    const [isLoading, setIsLoading] = useState(true);

    const [config, setConfig] = useState<WidgetConfig>(widgetConfigDefault);

    useEffect(() => {
        const fetchConfig = async () => {
            if (!projectId || projectId === "local_project_id") {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`https://ai-widget-saas.onrender.com/admin/${projectId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data) {
                        setConfig({
                            project_id: data.id,
                            botName: data.bot_name || widgetConfigDefault.botName,
                            primaryColor: data.primary_color || widgetConfigDefault.primaryColor,
                            welcomeMessage: data.welcome_message || widgetConfigDefault.welcomeMessage
                        })
                    }
                } else {
                    console.error('Ошибка сервера:', response.status);
                }
            } catch (error) {
                console.error("Ошибка сети:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchConfig();
    }, [projectId]);

    return (
        <WidgetConfigContext.Provider value={{ ...config, isLoading }}>
            {children}
        </WidgetConfigContext.Provider>
    )
}

export function useWidgetConfig() {
    return useContext(WidgetConfigContext);
}