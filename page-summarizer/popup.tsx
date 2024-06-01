import "./style.css"

import { useState } from "react"

const IndexPopup = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [summary, setSummary] = useState(null)
  const handler = () => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      console.log(tabs[0].url)
      fetchSummary(tabs[0].url)
    })
  }
  const fetchSummary = async (url) => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:3500/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url })
      })
      const data = await response.json()
      setSummary(data.result)
    } catch (error) {
      setErr(error.message)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="min-w-60 min-h-96 p-1 rounded-lg">
      <button onClick={handler}>Get Summary</button>
      {isLoading && <p>Loading...</p>}
      {err ? <p>{err}</p> : <p>{summary}</p>}
    </div>
  )
}

export default IndexPopup
