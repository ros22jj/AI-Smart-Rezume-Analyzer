import { useState } from 'react';
// import { AnimatePresence } from 'framer-motion';
import { motion, AnimatePresence } from 'framer-motion';


import { useGitHub } from '../hooks/useGitHub';

export default function GitHubExport({ reportData, isOpen, onClose }) {
  const [repoInput, setRepoInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const { connect, exportReport, error, loading, isConnected, repo } = useGitHub();

  const handleExport = async () => {
    try {
      if (!isConnected) {
        connect(tokenInput, repoInput);
      }
      const result = await exportReport(reportData, reportData.candidateName);
      alert(`✅ Saved to GitHub: ${result.file}`);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !reportData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'rgba(10,6,25,0.95)', borderRadius: 24, padding: '36px 32px',
            border: '1px solid rgba(139,92,246,0.4)', minWidth: 420, maxWidth: '90vw',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)',
          }}
        >
          <h2 style={{
            fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 24, color: '#f1f0ff',
            marginBottom: 8, textAlign: 'center',
          }}>
            💾 Export to GitHub
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(200,195,230,0.7)', marginBottom: 24, textAlign: 'center' }}>
            Save this {reportData.overallScore}% report as Markdown file
          </p>

          {!isConnected ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#c4b5fd', marginBottom: 6 }}>
                  Repository (owner/repo)
                </label>
                <input
                  value={repoInput}
                  onChange={e => setRepoInput(e.target.value)}
                  placeholder="e.g., yourusername/resume-reports"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(139,92,246,0.3)',
                    background: 'rgba(20,15,40,0.5)', color: '#f1f0ff', fontSize: 14,
                    outline: 'none', backdropFilter: 'blur(10px)',
                  }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#c4b5fd', marginBottom: 6 }}>
                  GitHub Token (PAT with repo scope)
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(139,92,246,0.3)',
                    background: 'rgba(20,15,40,0.5)', color: '#f1f0ff', fontSize: 14,
                    outline: 'none', backdropFilter: 'blur(10px)',
                  }}
                />
                <div style={{ fontSize: 11, color: 'rgba(200,195,230,0.6)', marginTop: 4 }}>
                  Create at github.com/settings/tokens → Classic → repo permissions
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 24, padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: 12, border: '1px solid rgba(34,197,94,0.3)' }}>
              <div style={{ fontSize: 14, color: '#34d399', fontWeight: 600 }}>✅ Connected</div>
              <div style={{ fontSize: 12, color: 'rgba(200,195,230,0.8)' }}>{repo}</div>
              <motion.button whileHover={{ scale: 0.98 }} onClick={() => {/* disconnect impl in hook */}} style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>Disconnect</motion.button>
            </div>
          )}

          {error && (
            <div style={{ padding: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid #f87171', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#f87171' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              disabled={loading || (!isConnected && (!repoInput || !tokenInput))}
              style={{
                flex: 1, padding: '14px 20px', borderRadius: 12, border: 'none',
                background: loading ? 'rgba(75,85,99,0.3)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#fff', fontWeight: 600, fontSize: 14, cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? '🚀 Saving...' : '💾 Export Report'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                flex: 1, padding: '14px 20px', borderRadius: 12, border: '1px solid rgba(139,92,246,0.3)',
                background: 'transparent', color: '#c4b5fd', fontWeight: 600, fontSize: 14,
              }}
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
