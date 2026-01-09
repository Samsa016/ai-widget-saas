import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const WIDGET_ID = "smart-embed-widget-container"

function initWidget() {
  if (document.getElementById(WIDGET_ID)) return;

  const widgetDiv = document.createElement('div')
  widgetDiv.id = WIDGET_ID
  document.body.appendChild(widgetDiv)

  const shadowRoot = widgetDiv.attachShadow({mode: "open"})

  const root = ReactDOM.createRoot(shadowRoot)

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
initWidget()