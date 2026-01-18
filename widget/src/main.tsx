import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { WidgetConfigProvider } from './widget_config'
import styles from './index.css?inline'

const WIDGET_ID = "smart-embed-widget-container"

async function initWidget() {
  if (document.getElementById(WIDGET_ID)) return;

  const scriptTag = document.currentScript || document.querySelector("script[data-id]");
  const project_id = scriptTag?.getAttribute("data-id") || "local_project_id"

  console.log("Виджет стартует. Project ID:", project_id);
  
  const widgetDiv = document.createElement('div')
  widgetDiv.id = WIDGET_ID
  document.body.appendChild(widgetDiv)

  const shadowRoot = widgetDiv.attachShadow({mode: "open"})

  const styleTag = document.createElement('style')
  styleTag.innerHTML = styles
  shadowRoot.appendChild(styleTag)

  const root = ReactDOM.createRoot(shadowRoot)


  root.render(
    <React.StrictMode>
      <div className="font-sans text-base antialiased">
        <WidgetConfigProvider projectId={project_id}>
          <App />
        </WidgetConfigProvider>
      </div>
    </React.StrictMode>
  )
}
initWidget()