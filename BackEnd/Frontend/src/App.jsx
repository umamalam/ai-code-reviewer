import { useState } from "react"
import prism from "prismjs"
import "prismjs/themes/prism-tomorrow.css"
import axios from "axios"
import "./App.css"

function App() {
    const [code, setCode] = useState(`function calculateTotal(price, quantity) {
    let total = price * quantity

    if (quantity = 0) {
        return 0
    }

    console.log("Total: " + total)

    return total
}`)

    const [review, setReview] = useState("")
    const [loading, setLoading] = useState(false)

    async function reviewCode() {
        try {
            setLoading(true)
            setReview("")

            const response = await axios.post(
                "http://localhost:3000/ai/get-review",
                { code }
            )

            setReview(response.data)

        } catch (error) {
            console.error("Review Error:", error)

            if (error.response) {
                setReview(
                    `Backend Error:\n\n${error.response.data}`
                )
            } else {
                setReview("Unable to connect to the backend.")
            }

        } finally {
            setLoading(false)
        }
    }

    const highlightedCode = prism.highlight(
        code,
        prism.languages.javascript,
        "javascript"
    )

    return (
        <main>

            {/* LEFT SIDE */}
            <div className="left">

                <div className="code-editor">

                    <pre
                        className="highlighted-code"
                        dangerouslySetInnerHTML={{
                            __html: highlightedCode
                        }}
                    />

                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck="false"
                        className="code-input"
                    />

                </div>

                <button
                    onClick={reviewCode}
                    className="review"
                    disabled={loading}
                >
                    {loading ? "Reviewing..." : "Review Code"}
                </button>

            </div>


            {/* RIGHT SIDE */}
            <div className="right">

                {!review && !loading && (
                    <div className="placeholder">
                        <h2>AI Code Review</h2>

                        <p>
                            Write your code on the left and click
                            <strong> Review Code </strong>
                            to get an AI-powered review.
                        </p>
                    </div>
                )}

                {loading && (
                    <div className="placeholder">
                        <h2>Reviewing Code...</h2>

                        <p>
                            AI is analyzing your code. Please wait...
                        </p>
                    </div>
                )}

                {review && !loading && (
                    <div className="review-content">

                        <h2>AI Code Review</h2>

                        <pre>{review}</pre>

                    </div>
                )}

            </div>

        </main>
    )
}

export default App