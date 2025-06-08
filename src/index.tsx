import { createRoot } from 'react-dom/client'
import * as React from 'react'
import './styles.css'
import App from './App'

const root = document.getElementById('root')

if(root != null) 
    createRoot(root).render(<App />)
