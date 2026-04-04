import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";

function Particle({ index }) {
  const size = Math.random() * 4 + 2;
  const duration = Math.random() * 14 + 10;
  const delay = Math.random() * 10;
  const xStart = Math.random() * 100;
  const colors = [
    "rgba(99,179,237,0.55)",
    "rgba(154,117,246,0.5)",
    "rgba(240,171,252,0.45)",
    "rgba(52,211,153,0.4)",
  ];
  return (
    <motion.div
      style={{
        position: "absolute",
        left: `${xStart}%`,
        bottom: "-10px",
        width: size,
        height: size,
        borderRadius: "50%",
        background: colors[index % colors.length],
        pointerEvents: "none",
      }}
      animate={{
        y: [0, -900],
        x: [0, (Math.random() - 0.5) * 180],
        opacity: [0, 0.9, 0],
        scale: [0.5, 1.3, 0.5],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function Background() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 25, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 25, damping: 20 });
  const negX = useTransform(springX, v => -v);
  const negY = useTransform(springY, v => -v);

  useEffect(() => {
    const onMove = (e) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 50);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 50);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
      }} />
      <motion.div style={{
        position: "absolute", borderRadius: "50%",
        width: 750, height: 750, top: "-20%", left: "-15%",
        background: "radial-gradient(circle, rgba(109,40,217,0.4) 0%, transparent 70%)",
        filter: "blur(70px)", x: springX, y: springY,
      }}
        animate={{ scale: [1, 1.18, 1], rotate: [0, 25, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div style={{
        position: "absolute", borderRadius: "50%",
        width: 650, height: 650, bottom: "-20%", right: "-10%",
        background: "radial-gradient(circle, rgba(29,78,216,0.45) 0%, transparent 70%)",
        filter: "blur(65px)", x: negX, y: negY,
      }}
        animate={{ scale: [1, 1.22, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div style={{
        position: "absolute", borderRadius: "50%",
        width: 420, height: 420, top: "35%", left: "38%",
        background: "radial-gradient(circle, rgba(219,39,119,0.22) 0%, transparent 70%)",
        filter: "blur(55px)",
      }}
        animate={{ x: [0, 90, -50, 0], y: [0, -70, 50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)
        `,
        backgroundSize: "65px 65px",
      }} />
      {Array.from({ length: 28 }).map((_, i) => <Particle key={i} index={i} />)}
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      style={{
        position: "fixed", top: 18, left: "50%",
        transform: "translateX(-50%)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 20px", borderRadius: 18,
        background: scrolled ? "rgba(8,5,20,0.85)" : "rgba(10,6,25,0.65)",
        border: "1px solid rgba(139,92,246,0.25)",
        backdropFilter: "blur(24px)",
        width: "min(92vw, 940px)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
        transition: "background 0.3s",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 9,
        fontFamily: "'Outfit', sans-serif", fontWeight: 800,
        fontSize: 17, color: "#f1f0ff",
      }}>
        <motion.span
          animate={{ rotate: [0, 15, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ display: "inline-block", fontSize: 22 }}
        >
          ⚡
        </motion.span>
        <span>ResumeAI</span>
        <span style={{
          fontSize: 9, padding: "2px 8px", borderRadius: 100,
          background: "rgba(124,58,237,0.3)", color: "#c4b5fd",
          border: "1px solid rgba(139,92,246,0.45)",
          fontWeight: 700, letterSpacing: "0.08em",
        }}>
          PRO
        </span>
      </div>

      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {["Features", "How it works", "Pricing"].map((item) => (
          <span key={item} style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13.5, color: "rgba(200,195,230,0.7)",
            cursor: "pointer", transition: "color 0.2s",
          }}
            onMouseEnter={e => e.target.style.color = "#f1f0ff"}
            onMouseLeave={e => e.target.style.color = "rgba(200,195,230,0.7)"}
          >
            {item}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <SignInButton mode="modal">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{
            padding: "8px 18px", borderRadius: 11,
            border: "1px solid rgba(139,92,246,0.5)",
            background: "rgba(139,92,246,0.1)",
            color: "#c4b5fd", fontSize: 13, fontWeight: 600,
            fontFamily: "'Outfit', sans-serif", cursor: "pointer",
          }}>
            Sign in
          </motion.button>
        </SignInButton>
        <SignUpButton mode="modal">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(124,58,237,0.6)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "8px 20px", borderRadius: 11, border: "none",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)",
              color: "#fff", fontSize: 13, fontWeight: 600,
              fontFamily: "'Outfit', sans-serif", cursor: "pointer",
              boxShadow: "0 0 20px rgba(124,58,237,0.35)",
            }}
          >
            Get started free
          </motion.button>
        </SignUpButton>
      </div>
    </motion.nav>
  );
}

function Badge({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "7px 18px", borderRadius: 100,
        border: "1px solid rgba(139,92,246,0.5)",
        background: "rgba(139,92,246,0.12)",
        backdropFilter: "blur(12px)",
        fontSize: 11, fontFamily: "'DM Mono', monospace",
        color: "#c4b5fd", letterSpacing: "0.1em",
        marginBottom: 30,
      }}
    >
      <motion.span
        animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#a78bfa", boxShadow: "0 0 10px #a78bfa",
          display: "inline-block",
        }}
      />
      {children}
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc, color, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      style={{
        position: "relative", borderRadius: 22, padding: "30px 26px",
        background: hovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
        border: hovered ? `1px solid ${color}60` : "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        cursor: "default", overflow: "hidden",
        transition: "background 0.3s, border 0.3s",
      }}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, borderRadius: 22,
              background: `radial-gradient(circle at 50% 0%, ${color}20 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>
      <motion.div
        animate={hovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
        transition={{ type: "spring", bounce: 0.5 }}
        style={{
          width: 52, height: 52, borderRadius: 15,
          background: `${color}22`, border: `1px solid ${color}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, marginBottom: 18,
        }}
      >
        {icon}
      </motion.div>
      <div style={{
        fontFamily: "'Outfit', sans-serif", fontWeight: 700,
        fontSize: 17, color: "#f1f0ff", marginBottom: 10,
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14, color: "rgba(200,195,230,0.7)", lineHeight: 1.7,
      }}>
        {desc}
      </div>
    </motion.div>
  );
}

function StepCard({ number, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      style={{
        display: "flex", gap: 20, alignItems: "flex-start",
        padding: "24px", borderRadius: 18,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: "linear-gradient(135deg, #7c3aed, #2563eb)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Outfit', sans-serif", fontWeight: 800,
        fontSize: 18, color: "#fff",
        boxShadow: "0 0 20px rgba(124,58,237,0.4)",
      }}>
        {number}
      </div>
      <div>
        <div style={{
          fontFamily: "'Outfit', sans-serif", fontWeight: 700,
          fontSize: 16, color: "#f1f0ff", marginBottom: 6,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13.5, color: "rgba(200,195,230,0.65)", lineHeight: 1.7,
        }}>
          {desc}
        </div>
      </div>
    </motion.div>
  );
}

function StatPill({ value, label, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: "spring", bounce: 0.45 }}
      whileHover={{ scale: 1.06 }}
      style={{
        textAlign: "center", padding: "22px 28px", borderRadius: 20,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{
        fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 34,
        background: "linear-gradient(90deg, #c4b5fd, #818cf8, #60a5fa)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 11,
        color: "rgba(180,175,210,0.65)", marginTop: 5, letterSpacing: "0.08em",
      }}>
        {label}
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const features = [
    { icon: "📄", title: "Smart Resume Parsing", desc: "Upload PDF or DOCX files. Our AI instantly extracts skills, experience, and education with pinpoint accuracy.", color: "#60a5fa", delay: 0 },
    { icon: "🎯", title: "Job Description Matching", desc: "Paste any job description and get a real-time compatibility score showing exactly how well you match.", color: "#a78bfa", delay: 0.1 },
    { icon: "🧠", title: "Gemini AI Feedback", desc: "Google Gemini analyzes your resume deeply and gives you specific, actionable feedback to improve it.", color: "#f472b6", delay: 0.2 },
    { icon: "📊", title: "Skill Gap Analysis", desc: "Find out exactly which skills you are missing for your target role and get suggestions to bridge the gap.", color: "#34d399", delay: 0.3 },
    { icon: "⚡", title: "Instant Scoring", desc: "Get a detailed score breakdown across sections — summary, experience, skills, formatting and more.", color: "#fbbf24", delay: 0.4 },
    { icon: "🔒", title: "Secure and Private", desc: "Your resume data is encrypted and never shared. Full privacy with Clerk authentication built in.", color: "#f87171", delay: 0.5 },
  ];

  const steps = [
    { number: "01", title: "Create your account", desc: "Sign up in seconds using Clerk's secure authentication system.", delay: 0 },
    { number: "02", title: "Upload your resume", desc: "Drag and drop your PDF or DOCX resume file into the analyzer.", delay: 0.15 },
    { number: "03", title: "Paste the job description", desc: "Add the job description you want to apply for to get a match score.", delay: 0.3 },
    { number: "04", title: "Get AI feedback instantly", desc: "Receive detailed Gemini AI feedback, scores, and skill gap analysis in seconds.", delay: 0.45 },
  ];

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <Background />
      <Navbar />

      <section style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: "120px 24px 80px",
        textAlign: "center",
      }}>
        <Badge>✦ POWERED BY GOOGLE GEMINI AI · MERN STACK</Badge>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13, color: "rgba(167,139,250,0.8)",
            letterSpacing: "0.15em", marginBottom: 16,
            textTransform: "uppercase",
          }}
        >
          👋 Welcome to
        </motion.div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ overflow: "hidden" }}>
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(52px, 9vw, 90px)",
                lineHeight: 1.0,
                color: "#f1f0ff",
              }}
            >
              AI Resume
            </motion.div>
          </div>
          <div style={{ overflow: "hidden" }}>
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(52px, 9vw, 90px)",
                lineHeight: 1.0,
                background: "linear-gradient(90deg, #c084fc, #818cf8, #60a5fa, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundSize: "300% auto",
                animation: "gradientShift 5s ease infinite",
              }}
            >
              Analyzer
            </motion.div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "clamp(15px, 2.5vw, 19px)",
            color: "rgba(200,195,230,0.75)",
            lineHeight: 1.75, maxWidth: 600,
            marginBottom: 18,
          }}
        >
          Stop guessing why you are not getting callbacks.
          <br />
          <strong style={{ color: "#c4b5fd" }}>Upload. Analyze. Get hired.</strong>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05 }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, color: "rgba(167,139,250,0.7)",
            marginBottom: 40, fontStyle: "italic",
          }}
        >
          "Your resume is your first impression — make it unforgettable."
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 70 }}
        >
          <SignUpButton mode="modal">
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: "0 0 50px rgba(124,58,237,0.7)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "16px 40px", borderRadius: 16, border: "none",
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
                color: "#fff", fontSize: 16, fontWeight: 700,
                fontFamily: "'Outfit', sans-serif", cursor: "pointer",
                boxShadow: "0 0 30px rgba(124,58,237,0.45)",
                letterSpacing: "0.01em",
              }}
            >
              🚀 Analyze My Resume — Free
            </motion.button>
          </SignUpButton>

          <SignInButton mode="modal">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "15px 36px", borderRadius: 16,
                border: "1px solid rgba(139,92,246,0.5)",
                background: "rgba(139,92,246,0.1)",
                color: "#c4b5fd", fontSize: 16, fontWeight: 600,
                fontFamily: "'Outfit', sans-serif", cursor: "pointer",
              }}
            >
              Sign in →
            </motion.button>
          </SignInButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16, width: "100%", maxWidth: 520,
          }}
        >
          <StatPill value="98%" label="ACCURACY RATE" delay={1.4} />
          <StatPill value="10s" label="ANALYSIS TIME" delay={1.5} />
          <StatPill value="50K+" label="RESUMES ANALYZED" delay={1.6} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          style={{ marginTop: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            letterSpacing: "0.14em", color: "rgba(167,139,250,0.45)",
          }}>
            SCROLL DOWN
          </div>
          <motion.div
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{
              width: 22, height: 36, borderRadius: 11,
              border: "1px solid rgba(139,92,246,0.35)",
              display: "flex", alignItems: "flex-start",
              justifyContent: "center", paddingTop: 6,
            }}
          >
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{ width: 4, height: 4, borderRadius: "50%", background: "#a78bfa" }}
            />
          </motion.div>
        </motion.div>
      </section>

      <section style={{ position: "relative", zIndex: 1, padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 60 }}
        >
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 14,
          }}>
            EVERYTHING YOU NEED
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800,
            fontSize: "clamp(30px, 5vw, 48px)", color: "#f1f0ff",
          }}>
            Features that get you{" "}
            <span style={{
              background: "linear-gradient(90deg, #c084fc, #818cf8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              hired
            </span>
          </h2>
        </motion.div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 18,
        }}>
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      <section style={{ position: "relative", zIndex: 1, padding: "80px 24px", maxWidth: 700, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 50 }}
        >
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 14,
          }}>
            SIMPLE PROCESS
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 42px)", color: "#f1f0ff",
          }}>
            How it{" "}
            <span style={{
              background: "linear-gradient(90deg, #34d399, #60a5fa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              works
            </span>
          </h2>
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((s) => (
            <StepCard key={s.number} {...s} />
          ))}
        </div>
      </section>

      <section style={{ position: "relative", zIndex: 1, padding: "100px 24px 120px", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{
            maxWidth: 700, margin: "0 auto",
            padding: "60px 40px", borderRadius: 28,
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(139,92,246,0.3)",
            backdropFilter: "blur(20px)",
            position: "relative", overflow: "hidden",
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
            style={{
              position: "absolute", width: 400, height: 400,
              borderRadius: "50%", top: "-50%", left: "50%",
              transform: "translateX(-50%)",
              background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 20,
          }}>
            START FOR FREE
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 44px)", color: "#f1f0ff",
            marginBottom: 16, lineHeight: 1.2,
          }}>
            Your dream job is
            <br />
            <span style={{
              background: "linear-gradient(90deg, #c084fc, #818cf8, #60a5fa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              one resume away.
            </span>
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16, color: "rgba(200,195,230,0.7)",
            marginBottom: 36, lineHeight: 1.7,
          }}>
            Join thousands of job seekers who improved their resumes and landed interviews with AI-powered feedback.
          </p>
          <SignUpButton mode="modal">
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: "0 0 60px rgba(124,58,237,0.7)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "16px 48px", borderRadius: 16, border: "none",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)",
                color: "#fff", fontSize: 17, fontWeight: 700,
                fontFamily: "'Outfit', sans-serif", cursor: "pointer",
                boxShadow: "0 0 30px rgba(124,58,237,0.4)",
              }}
            >
              Get started for free →
            </motion.button>
          </SignUpButton>
        </motion.div>
      </section>

      <footer style={{
        position: "relative", zIndex: 1,
        textAlign: "center", padding: "30px 24px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "'DM Mono', monospace",
        fontSize: 12, color: "rgba(167,139,250,0.4)",
        letterSpacing: "0.06em",
      }}>
        © 2025 ResumeAI · Built with MERN + Google Gemini · Made with ❤️
      </footer>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
      `}</style>
    </div>
  );
}