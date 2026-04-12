// ══════════════════════════════════════════════════════════════
// CareerMentor.jsx — AI Career Mentor Chat
// ══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import * as pdfjsLib from "pdfjs-dist";
import API_BASE from "../config";

// ── Configure pdf.js worker ───────────────────────────────────
// Use the legacy build to avoid ESM/worker issues in Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ── Groq API key from Vite env ────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

// ── Extract text from PDF file (client-side) ─────────────────
async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page    = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ") + "\n";
        }
        resolve(text.trim());
      } catch (err) {
        reject(new Error("Failed to read PDF: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

// ── Typing indicator ─────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "8px 0", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#6366f1",
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12,
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, marginRight: 8, flexShrink: 0, alignSelf: "flex-end",
        }}>
          🧠
        </div>
      )}
      <div style={{
        maxWidth: "75%",
        background: isUser
          ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
          : "rgba(255,255,255,0.07)",
        color: "#f1f5f9",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "10px 14px",
        fontSize: 14,
        lineHeight: 1.6,
        border: isUser ? "none" : "1px solid rgba(255,255,255,0.1)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function CareerMentor() {
  const { user } = useUser();

  // ── Setup screen state ──────────────────────────────────────
  const [resumeFile,    setResumeFile]    = useState(null);
  const [resumeText,    setResumeText]    = useState("");
  const [jobDesc,       setJobDesc]       = useState("");
  const [isExtracting,  setIsExtracting]  = useState(false);
  const [extractError,  setExtractError]  = useState("");
  const [isStarting,    setIsStarting]    = useState(false);
  const [startError,    setStartError]    = useState("");

  // ── Chat state ───────────────────────────────────────────────
  const [sessionId,  setSessionId]  = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [inputMsg,   setInputMsg]   = useState("");
  const [isSending,  setIsSending]  = useState(false);
  const [sendError,  setSendError]  = useState("");
  const [careerCtx,  setCareerCtx]  = useState(null);

  const chatEndRef  = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // ── Handle file pick ─────────────────────────────────────────
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setExtractError("");
    setResumeText("");

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "pdf") {
      setIsExtracting(true);
      try {
        const text = await extractPdfText(file);
        if (!text || text.length < 50) {
          setExtractError("Couldn't extract text from this PDF. Please paste your resume text in the box below.");
        } else {
          setResumeText(text);
        }
      } catch (err) {
        setExtractError("PDF read failed: " + err.message + ". Please paste your resume text below.");
      } finally {
        setIsExtracting(false);
      }
    } else if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = (ev) => setResumeText(ev.target.result || "");
      reader.readAsText(file);
    } else {
      setExtractError("Only PDF and TXT files are supported. Please paste your resume text below.");
    }
  }, []);

  // ── Start session ────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!resumeText || resumeText.trim().length < 50) {
      setStartError("Please upload a resume or paste your resume text (minimum 50 characters).");
      return;
    }
    setStartError("");
    setIsStarting(true);

    try {
      const res = await fetch(`${API_BASE}/api/mentor/start`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText:     resumeText.trim(),
          jobDescription: jobDesc.trim(),  // new field name
          jdText:         jobDesc.trim(),  // old field name — backwards compat
          clerkUserId:    user?.id       || "guest",
          userName:       user?.fullName || "",
          userEmail:      user?.primaryEmailAddress?.emailAddress || "",
          groqApiKey:     GROQ_API_KEY,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to start session");

      setSessionId(data.sessionId);
      setCareerCtx(data.careerContext);
      setMessages([{ role: "assistant", content: data.welcomeMessage }]);
    } catch (err) {
      setStartError("Error starting session: " + err.message);
    } finally {
      setIsStarting(false);
    }
  }, [resumeText, jobDesc, user]);

  // ── Send message ─────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const msg = inputMsg.trim();
    if (!msg || isSending || !sessionId) return;

    setInputMsg("");
    setSendError("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE}/api/mentor/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: msg, groqApiKey: GROQ_API_KEY }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to get reply");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setSendError("Couldn't send message: " + err.message);
      // Re-add user message in error state — already added above so just show error
    } finally {
      setIsSending(false);
    }
  }, [inputMsg, isSending, sessionId]);

  // Ctrl+Enter or Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Download PDF ─────────────────────────────────────────────
  const handleDownloadPDF = () => {
    if (!sessionId) return;
    window.open(`${API_BASE}/api/mentor/pdf/${sessionId}`, "_blank");
  };

  // ── Reset to setup screen ────────────────────────────────────
  const handleReset = () => {
    setSessionId(null);
    setMessages([]);
    setResumeFile(null);
    setResumeText("");
    setJobDesc("");
    setCareerCtx(null);
    setInputMsg("");
    setSendError("");
    setStartError("");
    setExtractError("");
  };

  // ── Suggested quick questions ────────────────────────────────
  const quickQuestions = [
    "What are the biggest gaps in my resume?",
    "How should I improve my resume for this role?",
    "What skills should I learn next?",
    "How do I negotiate a better salary?",
    "Help me prepare for my interview",
  ];

  // ════════════════════════════════════════════════════════════
  // RENDER: Setup screen
  // ════════════════════════════════════════════════════════════
  if (!sessionId) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        padding: "32px 16px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1.2); opacity: 1; }
          }
          .mentor-btn {
            cursor: pointer;
            transition: all 0.2s;
          }
          .mentor-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            opacity: 0.9;
          }
          .mentor-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .drop-zone {
            transition: border-color 0.2s, background 0.2s;
          }
          .drop-zone:hover {
            border-color: #6366f1 !important;
            background: rgba(99,102,241,0.05) !important;
          }
        `}</style>

        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 16px",
            }}>🧠</div>
            <h1 style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700, margin: 0 }}>
              AI Career Mentor
            </h1>
            <p style={{ color: "#94a3b8", marginTop: 8, fontSize: 15 }}>
              Upload your resume and get personalised career coaching from AI
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 28,
          }}>
            {/* Resume upload */}
            <label style={{ display: "block", marginBottom: 6, color: "#cbd5e1", fontWeight: 600, fontSize: 13 }}>
              RESUME <span style={{ color: "#ef4444" }}>*</span>
            </label>

            {/* Drop zone */}
            <div
              className="drop-zone"
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed rgba(99,102,241,0.4)",
                borderRadius: 12,
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                background: "rgba(99,102,241,0.03)",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>
                {isExtracting ? "⏳" : resumeFile ? "✅" : "📄"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 13 }}>
                {isExtracting
                  ? "Extracting text from PDF…"
                  : resumeFile
                  ? `${resumeFile.name} — ${resumeText.length} chars extracted`
                  : "Click to upload PDF or TXT resume"}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {extractError && (
              <div style={{ color: "#fbbf24", fontSize: 12, marginBottom: 8, padding: "6px 10px", background: "rgba(251,191,36,0.1)", borderRadius: 6 }}>
                ⚠️ {extractError}
              </div>
            )}

            {/* Paste resume text */}
            <label style={{ display: "block", marginBottom: 6, color: "#94a3b8", fontSize: 12 }}>
              Or paste your resume text directly:
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your full resume text here…"
              rows={6}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "10px 12px",
                color: "#f1f5f9", fontSize: 13, resize: "vertical",
                outline: "none", fontFamily: "inherit",
              }}
            />

            {/* Job description */}
            <label style={{ display: "block", marginTop: 16, marginBottom: 6, color: "#cbd5e1", fontWeight: 600, fontSize: 13 }}>
              JOB DESCRIPTION <span style={{ color: "#64748b", fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the job description you're targeting (optional but recommended)…"
              rows={4}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "10px 12px",
                color: "#f1f5f9", fontSize: 13, resize: "vertical",
                outline: "none", fontFamily: "inherit",
              }}
            />

            {startError && (
              <div style={{ color: "#f87171", fontSize: 13, marginTop: 12, padding: "8px 12px", background: "rgba(248,113,113,0.1)", borderRadius: 8 }}>
                ❌ {startError}
              </div>
            )}

            <button
              className="mentor-btn"
              onClick={handleStart}
              disabled={isStarting || isExtracting || !resumeText.trim()}
              style={{
                width: "100%", marginTop: 20, padding: "14px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 600,
              }}
            >
              {isStarting ? "Starting your session…" : "🚀 Start Career Mentoring"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Chat screen
  // ════════════════════════════════════════════════════════════
  return (
    <div style={{
      height: "100vh",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        .mentor-btn {
          cursor: pointer;
          transition: all 0.2s;
        }
        .mentor-btn:hover:not(:disabled) {
          opacity: 0.85;
        }
        .mentor-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .quick-btn:hover {
          background: rgba(99,102,241,0.15) !important;
          border-color: rgba(99,102,241,0.5) !important;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px",
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>🧠</div>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>AI Career Mentor</div>
            <div style={{ color: "#4ade80", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              Active session
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="mentor-btn"
            onClick={handleDownloadPDF}
            style={{
              padding: "6px 12px", borderRadius: 8,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#cbd5e1", fontSize: 12, cursor: "pointer",
            }}
            title="Download chat as PDF"
          >
            📥 Export PDF
          </button>
          <button
            className="mentor-btn"
            onClick={handleReset}
            style={{
              padding: "6px 12px", borderRadius: 8,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#cbd5e1", fontSize: 12, cursor: "pointer",
            }}
          >
            🔄 New Session
          </button>
        </div>
      </div>

      {/* ── Skills badge strip ── */}
      {careerCtx?.skills?.length > 0 && (
        <div style={{
          display: "flex", gap: 6, padding: "8px 20px", flexWrap: "wrap",
          background: "rgba(255,255,255,0.02)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          flexShrink: 0,
        }}>
          {careerCtx.skills.slice(0, 8).map((s) => (
            <span key={s} style={{
              padding: "2px 8px", borderRadius: 100,
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#a5b4fc", fontSize: 11,
            }}>{s}</span>
          ))}
          {careerCtx.estimatedYOE > 0 && (
            <span style={{
              padding: "2px 8px", borderRadius: 100,
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.3)",
              color: "#6ee7b7", fontSize: 11,
            }}>~{careerCtx.estimatedYOE} yr exp</span>
          )}
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "16px 20px",
      }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {isSending && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, flexShrink: 0,
            }}>🧠</div>
            <div style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "18px 18px 18px 4px",
              padding: "6px 14px",
            }}>
              <TypingDots />
            </div>
          </div>
        )}
        {sendError && (
          <div style={{
            color: "#f87171", fontSize: 13, textAlign: "center",
            padding: "8px 12px", background: "rgba(248,113,113,0.1)",
            borderRadius: 8, margin: "8px 0",
          }}>
            ❌ {sendError}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Quick questions ── */}
      {messages.length <= 1 && (
        <div style={{
          padding: "0 20px 10px",
          display: "flex", gap: 6, flexWrap: "wrap",
          flexShrink: 0,
        }}>
          {quickQuestions.map((q) => (
            <button
              key={q}
              className="quick-btn mentor-btn"
              onClick={() => { setInputMsg(q); }}
              style={{
                padding: "6px 12px", borderRadius: 100,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8", fontSize: 12, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={{
        padding: "12px 20px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-end",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12, padding: "8px 12px",
        }}>
          <textarea
            ref={textareaRef}
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your career…"
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none",
              outline: "none", color: "#f1f5f9", fontSize: 14,
              resize: "none", fontFamily: "inherit", lineHeight: 1.5,
              maxHeight: 120, overflowY: "auto",
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button
            className="mentor-btn"
            onClick={handleSend}
            disabled={isSending || !inputMsg.trim()}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: inputMsg.trim() && !isSending
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "rgba(255,255,255,0.1)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0,
              color: "#fff",
            }}
          >
            ➤
          </button>
        </div>
        <div style={{ color: "#475569", fontSize: 11, marginTop: 4, textAlign: "center" }}>
          Press Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}




